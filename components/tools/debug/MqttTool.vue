<script setup lang="ts">
import {
  mqttBuildBrokerUrl,
  mqttBuildExport,
  mqttColorForIndex,
  mqttColorForTopic,
  mqttCreateEmptyStats,
  mqttEncodePublishPayload,
  mqttExportStamp,
  mqttFilterLogs,
  mqttFormatPayloadPreview,
  mqttGenClientId,
  mqttLoadPresetsFromStorage,
  mqttLogLineText,
  mqttMakeLogEntry,
  mqttNormalizePreset,
  mqttParseBrokerUrl,
  mqttParseSubTopics,
  mqttPayloadToString,
  mqttPersistPresets,
  mqttPrettyPayload,
  mqttPubFormatPlaceholder,
  mqttPushLog,
  mqttRemovePreset,
  mqttStatsText,
  mqttStatusLabel,
  mqttUpsertPreset,
  mqttValidateBrokerUrl,
  mqttValidateTopic,
  MQTT_PREVIEW_LEN,
  MQTT_PRESET_MAX,
  type MqttLogEntry,
  type MqttPayloadFormat,
  type MqttPreset,
  type MqttStats,
  type MqttStatusKind,
  type MqttSubItem,
} from '#shared/debug/mqtt'

type MqttNS = typeof import('mqtt')
type MqttClient = InstanceType<MqttNS['MqttClient']>
type IClientOptions = NonNullable<Parameters<MqttNS['connect']>[1]>

const {error, setError, clearError} = useToolState()
const {copy} = useClipboard()

const settingsOpen = ref(false)
const settingsTab = ref<'basic' | 'advanced'>('basic')
const showPassword = ref(false)

const connName = ref('')
const scheme = ref<'ws:' | 'wss:'>('ws:')
const host = ref('broker.emqx.io')
const port = ref(8083)
const path = ref('/mqtt')
const clientId = ref('')
const username = ref('')
const password = ref('')
const protocolVersion = ref<4 | 5>(5)
const keepalive = ref(60)
const connectTimeoutSec = ref(30)
const clean = ref(true)
const willEnabled = ref(false)
const willTopic = ref('')
const willPayload = ref('')
const willQos = ref<0 | 1 | 2>(0)
const willRetain = ref(false)

const status = ref<MqttStatusKind>('disconnected')
const subs = ref<MqttSubItem[]>([])
const logs = ref<MqttLogEntry[]>([])
const filterTopic = ref<string | null>(null)
const dirFilter = ref<'all' | 'in' | 'out'>('all')
const kwFilter = ref('')
const expandedLogIds = ref<Record<number, boolean>>({})
const autoScroll = ref(true)
const logEl = ref<HTMLElement | null>(null)

const subQuick = ref('')
const subDraft = ref('')
const subQos = ref<0 | 1 | 2>(0)
const subModalOpen = ref(false)

const pubTopic = ref('')
const pubQos = ref<0 | 1 | 2>(0)
const pubRetain = ref(false)
const pubFormat = ref<MqttPayloadFormat>('text')
const pubPayload = ref('')

const presets = ref<MqttPreset[]>([])
const selectedPresetId = ref('')
const presetModalOpen = ref(false)
const presetModalName = ref('')
const presetSavePassword = ref(true)
const stats = ref<MqttStats>(mqttCreateEmptyStats())
const statsTick = ref(0)

let client: MqttClient | null = null
let mqttLib: typeof import('mqtt') | null = null
let statsTimer: ReturnType<typeof setInterval> | null = null
const ready = ref(false)

const settingsLocked = computed(
    () => status.value === 'connected' || status.value === 'connecting',
)

const builtUrl = computed(() =>
    mqttBuildBrokerUrl({
      scheme: scheme.value,
      host: host.value,
      port: port.value,
      path: path.value,
    }),
)

const connSummary = computed(() => {
  const name = connName.value.trim()
  if (builtUrl.value.ok) {
    return name ? name + ' · ' + builtUrl.value.url : builtUrl.value.url
  }
  return name || '未配置连接'
})

const filteredLogs = computed(() =>
    mqttFilterLogs(logs.value, {
      topic: filterTopic.value,
      dir: dirFilter.value,
      keyword: kwFilter.value,
    }),
)

const statsText = computed(() => {
  void statsTick.value
  if (!stats.value.connectedAt && stats.value.recv === 0 && stats.value.sent === 0) return ''
  return mqttStatsText(stats.value, Date.now())
})

const pubPlaceholder = computed(() => mqttPubFormatPlaceholder(pubFormat.value))

function scrollLogToBottom() {
  if (!autoScroll.value) return
  nextTick(() => {
    const el = logEl.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function onLogScroll() {
  const el = logEl.value
  if (!el) return
  const dist = el.scrollHeight - el.scrollTop - el.clientHeight
  autoScroll.value = dist < 48
}

function appendLog(dir: MqttLogEntry['dir'], meta?: Partial<MqttLogEntry>) {
  mqttPushLog(logs.value, mqttMakeLogEntry(dir, meta))
  scrollLogToBottom()
}

function startStatsTimer() {
  stopStatsTimer(false)
  stats.value = {...mqttCreateEmptyStats(), connectedAt: Date.now()}
  statsTimer = setInterval(() => {
    statsTick.value++
  }, 1000)
  statsTick.value++
}

function stopStatsTimer(markStopped: boolean) {
  if (statsTimer) {
    clearInterval(statsTimer)
    statsTimer = null
  }
  if (markStopped && stats.value.connectedAt != null) {
    stats.value = {...stats.value, stoppedAt: Date.now()}
  }
  statsTick.value++
}

function bumpRecv(payload: string) {
  stats.value.recv += 1
  stats.value.recvBytes += payload ? payload.length : 0
}

function bumpSentBytes(n: number) {
  stats.value.sent += 1
  stats.value.sentBytes += typeof n === 'number' && n >= 0 ? n : 0
}

function randomClientId() {
  clientId.value = mqttGenClientId()
}

function loadPresets() {
  presets.value = mqttLoadPresetsFromStorage()
}

function persistPresets(list: MqttPreset[]) {
  mqttPersistPresets(list)
  presets.value = list
}

function collectPreset(id: string, name: string, includePassword = true): MqttPreset | null {
  if (!builtUrl.value.ok) return null
  return mqttNormalizePreset({
    id,
    name,
    url: builtUrl.value.url,
    clientId: clientId.value,
    username: username.value,
    password: includePassword ? password.value : '',
    protocolVersion: protocolVersion.value,
    clean: clean.value,
    keepalive: keepalive.value,
    connectTimeoutSec: connectTimeoutSec.value,
    will: {
      enabled: willEnabled.value,
      topic: willTopic.value,
      payload: willPayload.value,
      qos: willQos.value,
      retain: willRetain.value,
    },
  })
}

function fillFromPreset(preset: MqttPreset) {
  const p = mqttNormalizePreset(preset)
  if (!p) return
  connName.value = p.name || ''
  const parsed = mqttParseBrokerUrl(p.url)
  if (parsed.ok) {
    scheme.value = parsed.scheme
    host.value = parsed.host
    port.value = parsed.port
    path.value = parsed.path
  }
  clientId.value = p.clientId
  username.value = p.username
  password.value = p.password
  protocolVersion.value = p.protocolVersion
  clean.value = p.clean
  keepalive.value = p.keepalive
  connectTimeoutSec.value = p.connectTimeoutSec
  willEnabled.value = p.will.enabled
  willTopic.value = p.will.topic
  willPayload.value = p.will.payload
  willQos.value = p.will.qos
  willRetain.value = p.will.retain
}

function applyPreset() {
  clearError()
  const id = selectedPresetId.value
  if (!id) {
    setError('请先选择预设')
    return
  }
  const found = presets.value.find((p) => String(p.id) === String(id))
  if (!found) {
    setError('预设不存在')
    loadPresets()
    selectedPresetId.value = ''
    return
  }
  fillFromPreset(found)
}

function defaultPresetName(): string {
  if (connName.value.trim()) return connName.value.trim()
  if (host.value.trim()) return host.value.trim()
  if (builtUrl.value.ok) {
    try {
      const h = new URL(builtUrl.value.url).hostname
      if (h) return h
    } catch {
      /* ignore */
    }
    return builtUrl.value.url
  }
  return '预设 ' + new Date().toLocaleTimeString()
}

function savePreset() {
  clearError()
  const id = selectedPresetId.value
  if (!id) {
    openPresetModal()
    return
  }
  const existing = presets.value.find((p) => String(p.id) === String(id))
  if (!existing) {
    openPresetModal()
    return
  }
  const preset = collectPreset(existing.id, existing.name, true)
  if (!preset) {
    setError('请先填写 Broker URL')
    return
  }
  const list = mqttUpsertPreset(presets.value, preset)
  persistPresets(list)
  selectedPresetId.value = preset.id
}

function openPresetModal() {
  clearError()
  if (!builtUrl.value.ok) {
    setError('请先填写 Broker URL')
    openSettings('basic')
    return
  }
  presetModalName.value = defaultPresetName()
  presetSavePassword.value = true
  presetModalOpen.value = true
}

function confirmSavePresetAs() {
  clearError()
  const name = presetModalName.value.trim() || defaultPresetName()
  const preset = collectPreset(
      String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8),
      name,
      presetSavePassword.value,
  )
  if (!preset) {
    setError('请先填写 Broker URL')
    return
  }
  if (presets.value.length >= MQTT_PRESET_MAX) {
    setError('预设最多 ' + MQTT_PRESET_MAX + ' 个，将覆盖最旧项')
  }
  const list = mqttUpsertPreset(presets.value, preset)
  persistPresets(list)
  selectedPresetId.value = preset.id
  presetModalOpen.value = false
  clearError()
}

function deletePreset() {
  clearError()
  const id = selectedPresetId.value
  if (!id) {
    setError('请先选择预设')
    return
  }
  const found = presets.value.find((p) => String(p.id) === String(id))
  const label = found?.name || id
  if (typeof confirm === 'function' && !confirm('确认删除预设「' + label + '」？')) return
  const list = mqttRemovePreset(presets.value, id)
  persistPresets(list)
  selectedPresetId.value = ''
}

function isConnected(): boolean {
  return !!(client && client.connected)
}

function disconnect(silent = false) {
  if (client) {
    try {
      client.end(true)
    } catch {
      /* ignore */
    }
    try {
      client.removeAllListeners()
    } catch {
      /* ignore */
    }
    client = null
  }
  stopStatsTimer(true)
  status.value = 'disconnected'
  if (!silent) appendLog('system', {message: '已断开'})
}

async function connect() {
  clearError()
  if (!ready.value || !mqttLib) {
    setError('mqtt.js 尚未加载完成')
    return
  }
  if (!builtUrl.value.ok) {
    setError(builtUrl.value.error || '请完善服务器地址')
    openSettings('basic')
    return
  }
  const v = mqttValidateBrokerUrl(builtUrl.value.url)
  if (!v.ok) {
    setError(v.error)
    return
  }

  let willOption: IClientOptions['will'] | undefined
  if (willEnabled.value) {
    const willV = mqttValidateTopic(willTopic.value.trim(), false)
    if (!willV.ok) {
      setError('LWT: ' + willV.error)
      return
    }
    willOption = {
      topic: willV.topic,
      payload: willPayload.value,
      qos: willQos.value,
      retain: willRetain.value,
    }
  }

  disconnect(true)

  let cid = clientId.value.trim()
  if (!cid) {
    cid = mqttGenClientId()
    clientId.value = cid
  }

  const options: IClientOptions = {
    clientId: cid,
    clean: clean.value,
    keepalive: keepalive.value >= 0 ? keepalive.value : 60,
    connectTimeout: (connectTimeoutSec.value > 0 ? connectTimeoutSec.value : 30) * 1000,
    protocolVersion: protocolVersion.value,
    reconnectPeriod: 0,
  }
  if (username.value) options.username = username.value
  if (password.value) options.password = password.value
  if (willOption) options.will = willOption

  status.value = 'connecting'
  appendLog('system', {message: '正在连接 ' + v.normalized})

  try {
    client = mqttLib.connect(v.normalized, options)
  } catch (e) {
    status.value = 'error'
    const msg = e instanceof Error ? e.message : String(e)
    appendLog('system', {message: '连接错误: ' + msg})
    setError('连接失败: ' + msg)
    client = null
    return
  }

  client.on('connect', () => {
    startStatsTimer()
    status.value = 'connected'
    closeSettings()
    appendLog('system', {
      message: '已连接 ' + v.normalized + ' (clientId=' + cid + ')',
    })
    if (subs.value.length > 0 && client) {
      for (const sub of subs.value) {
        const topic = sub.topic
        const qos = sub.qos
        client.subscribe(topic, {qos}, (err) => {
          if (err) {
            appendLog('system', {
              message: '重订阅失败 ' + topic + ': ' + (err.message || err),
            })
            return
          }
          const idx = subs.value.findIndex((s) => s.topic === topic)
          if (idx >= 0) {
            const cur = subs.value[idx]
            if (cur.pending) {
              subs.value[idx] = {...cur, pending: false}
            }
          }
        })
      }
    }
  })

  client.on('message', (topic, payload, packet) => {
    const text = mqttPayloadToString(payload)
    bumpRecv(text)
    appendLog('in', {
      topic,
      qos: packet && packet.qos !== undefined ? packet.qos : 0,
      retain: !!(packet && packet.retain),
      payload: text,
    })
  })

  client.on('error', (err) => {
    const msg = err && err.message ? err.message : String(err || '未知错误')
    status.value = 'error'
    appendLog('system', {message: '错误: ' + msg})
    setError('MQTT 错误: ' + msg)
  })

  client.on('close', () => {
    stopStatsTimer(true)
    status.value = 'disconnected'
    appendLog('system', {message: '连接已关闭'})
  })

  client.on('offline', () => {
    status.value = 'offline'
    appendLog('system', {message: '客户端离线'})
  })
}

function pushSub(topic: string, qos: 0 | 1 | 2, pending = false) {
  if (subs.value.some((s) => s.topic === topic)) return
  subs.value = [
    ...subs.value,
    {topic, qos, color: mqttColorForIndex(subs.value.length), pending},
  ]
}

function removeSub(topic: string) {
  subs.value = subs.value.filter((s) => s.topic !== topic)
  if (filterTopic.value === topic) filterTopic.value = null
}

function doSubscribe() {
  clearError()
  const parsed = mqttParseSubTopics(subDraft.value)
  if (!parsed.ok) {
    setError(parsed.error || '主题无效')
    return
  }
  const existing: Record<string, boolean> = {}
  for (const s of subs.value) existing[s.topic] = true
  const toAdd = parsed.topics.filter((t) => !existing[t])
  const skippedDup = parsed.topics.length - toAdd.length
  if (toAdd.length === 0) {
    setError(skippedDup > 0 ? '所选主题均已订阅' : '请输入主题')
    return
  }

  if (!isConnected()) {
    for (const t of toAdd) {
      pushSub(t, subQos.value, true)
      appendLog('system', {
        message: '待连接后订阅 ' + t + ' (QoS ' + subQos.value + ')',
      })
    }
    subDraft.value = ''
    subQuick.value = ''
    subModalOpen.value = false
    return
  }

  const subMap: Record<string, { qos: 0 | 1 | 2 }> = {}
  for (const t of toAdd) subMap[t] = {qos: subQos.value}

  client!.subscribe(subMap, (err, granted) => {
    if (err) {
      appendLog('system', {message: '订阅失败: ' + (err.message || err)})
      setError('订阅失败: ' + (err.message || err))
      return
    }
    const okTopics: string[] = []
    if (Array.isArray(granted) && granted.length > 0) {
      for (const g of granted) {
        if (!g || g.topic === undefined) continue
        if ((g.qos as number) === 128 || (g.qos as number) === 0x80) {
          appendLog('system', {message: '订阅被拒 ' + g.topic})
          continue
        }
        const gQos =
            typeof g.qos === 'number' && g.qos >= 0 && g.qos <= 2
                ? (g.qos as 0 | 1 | 2)
                : subQos.value
        pushSub(g.topic, gQos)
        okTopics.push(g.topic)
        appendLog('out', {topic: g.topic, qos: gQos, message: 'SUBSCRIBE'})
      }
    } else {
      for (const t of toAdd) {
        pushSub(t, subQos.value)
        okTopics.push(t)
        appendLog('out', {topic: t, qos: subQos.value, message: 'SUBSCRIBE'})
      }
    }
    if (okTopics.length === 0) {
      setError('订阅失败（Broker 拒绝）')
      return
    }
    subDraft.value = ''
    subQuick.value = ''
    subModalOpen.value = false
    clearError()
  })
}

function quickSubscribe() {
  clearError()
  const topic = subQuick.value.trim()
  if (!topic) {
    setError('请输入主题')
    return
  }
  subDraft.value = topic
  doSubscribe()
}

function unsubscribe(topic: string) {
  clearError()
  if (!topic) return
  if (!isConnected()) {
    removeSub(topic)
    return
  }
  client!.unsubscribe(topic, (err) => {
    if (err) {
      appendLog('system', {
        message: '取消订阅失败 ' + topic + ': ' + (err.message || err),
      })
      setError('取消订阅失败')
      return
    }
    removeSub(topic)
    appendLog('out', {topic, message: 'UNSUBSCRIBE'})
  })
}

function unsubscribeAll() {
  clearError()
  if (subs.value.length === 0) {
    setError('暂无订阅')
    return
  }
  const topics = subs.value.map((s) => s.topic)
  if (!isConnected()) {
    subs.value = []
    filterTopic.value = null
    return
  }
  client!.unsubscribe(topics, (err) => {
    if (err) {
      appendLog('system', {message: '全部取消失败: ' + (err.message || err)})
      setError('全部取消失败')
      return
    }
    subs.value = []
    filterTopic.value = null
    for (const t of topics) {
      appendLog('out', {topic: t, message: 'UNSUBSCRIBE'})
    }
  })
}

function setFilter(topic: string | null) {
  if (!topic || topic === filterTopic.value) {
    filterTopic.value = null
  } else {
    filterTopic.value = topic
  }
}

function publish() {
  clearError()
  if (!isConnected()) {
    setError('请先连接 Broker')
    return
  }
  const tv = mqttValidateTopic(pubTopic.value.trim(), false)
  if (!tv.ok) {
    setError(tv.error)
    return
  }
  const encoded = mqttEncodePublishPayload(pubPayload.value, pubFormat.value)
  if (!encoded.ok) {
    setError(encoded.error)
    return
  }
  const pubData =
      typeof encoded.data === 'string'
        ? encoded.data
        : Buffer.from(encoded.data)
  client!.publish(
      tv.topic,
      pubData,
      {qos: pubQos.value, retain: pubRetain.value},
      (err) => {
        if (err) {
          appendLog('system', {message: '发布失败: ' + (err.message || err)})
          setError('发布失败: ' + (err.message || err))
          return
        }
        bumpSentBytes(encoded.bytes)
        appendLog('out', {
          topic: tv.topic,
          qos: pubQos.value,
          retain: pubRetain.value,
          payload: encoded.logText,
          format: encoded.format,
        })
      },
  )
}

function clearLog() {
  logs.value = []
  expandedLogIds.value = {}
}

function payloadRaw(entry: MqttLogEntry): string {
  if (entry.dir === 'system') return entry.message || entry.payload || ''
  return entry.payload || entry.message || ''
}

function isPayloadLong(entry: MqttLogEntry): boolean {
  return payloadRaw(entry).length > MQTT_PREVIEW_LEN
}

function isLogExpanded(id: number): boolean {
  return !!expandedLogIds.value[id]
}

function toggleLogExpand(id: number) {
  expandedLogIds.value = {
    ...expandedLogIds.value,
    [id]: !expandedLogIds.value[id],
  }
}

async function copyLogEntry(entry: MqttLogEntry) {
  clearError()
  await copy(mqttLogLineText(entry))
}

function onPublishKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    publish()
  }
}

function openSettings(tab: 'basic' | 'advanced' = 'basic') {
  settingsTab.value = tab
  settingsOpen.value = true
}

function closeSettings() {
  settingsOpen.value = false
}

function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (presetModalOpen.value) {
    presetModalOpen.value = false
    return
  }
  if (subModalOpen.value) {
    subModalOpen.value = false
    return
  }
  if (settingsOpen.value) settingsOpen.value = false
}

async function copyLog() {
  const filtered = filteredLogs.value
  if (!filtered.length) {
    setError('没有日志可复制')
    return
  }
  clearError()
  await copy(filtered.map(mqttLogLineText).join('\n'))
}

function exportLog() {
  clearError()
  const filtered = filteredLogs.value
  if (!filtered.length) {
    setError('没有日志可导出')
    return
  }
  const data = mqttBuildExport(filtered, {
    exportedAt: new Date().toISOString(),
    filter: {
      topic: filterTopic.value,
      dir: dirFilter.value,
      keyword: kwFilter.value,
    },
    stats: {
      connectedAt: stats.value.connectedAt,
      recv: stats.value.recv,
      sent: stats.value.sent,
      recvBytes: stats.value.recvBytes,
      sentBytes: stats.value.sentBytes,
    },
  })
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], {type: 'application/json'})
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'mqtt-log-' + mqttExportStamp(new Date()) + '.json'
  a.click()
  URL.revokeObjectURL(a.href)
}

function displayPayload(entry: MqttLogEntry): string {
  const raw = payloadRaw(entry)
  if (entry.dir === 'system') return raw
  const pretty = mqttPrettyPayload(raw)
  const text = pretty.json ? pretty.text : raw
  if (isLogExpanded(entry.id) || text.length <= MQTT_PREVIEW_LEN) return text
  return mqttFormatPayloadPreview(text, MQTT_PREVIEW_LEN)
}

function borderColor(entry: MqttLogEntry): string {
  if (entry.dir === 'system') return ''
  return mqttColorForTopic(entry.topic, subs.value)
}

onMounted(async () => {
  randomClientId()
  loadPresets()
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onGlobalKeydown)
  }
  try {
    const mod = await import('mqtt') as unknown as MqttNS & { default?: MqttNS }
    mqttLib = (mod.default && typeof mod.default.connect === 'function')
      ? mod.default
      : mod
    if (typeof mqttLib?.connect !== 'function') throw new Error('mqtt.connect 不可用')
    ready.value = true
  } catch (e) {
    setError('加载 mqtt.js 失败: ' + (e instanceof Error ? e.message : String(e)))
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onGlobalKeydown)
  }
  disconnect(true)
  stopStatsTimer(false)
})
</script>

<template>
  <ClientOnly>
    <UiToolShell title="MQTT 调试" :error="error" :dual="false">
      <template #actions>
        <button type="button" class="btn" :disabled="!ready || status === 'connecting' || status === 'connected'"
                @click="connect">连接
        </button>
        <button type="button" class="btn btn-ghost" :disabled="status === 'disconnected'" @click="disconnect()">断开
        </button>
        <span class="act-sep" aria-hidden="true"/>
        <button type="button" class="btn btn-ghost" :disabled="!logs.length" @click="clearLog">清空</button>
        <button type="button" class="btn btn-ghost" :disabled="!filteredLogs.length" @click="copyLog">复制</button>
        <button type="button" class="btn btn-ghost" :disabled="!filteredLogs.length" @click="exportLog">导出</button>
      </template>

      <div class="mqtt-layout">
        <div class="mqtt-side">
          <div class="conn-bar">
            <div class="conn-main">
            <span class="status-pill" :class="status">
              <span class="dot" aria-hidden="true"/>
              {{ mqttStatusLabel(status) }}
            </span>
              <div class="summary" :title="builtUrl.ok ? builtUrl.url : connSummary">{{ connSummary }}</div>
              <span v-if="statsText" class="stats">{{ statsText }}</span>
            </div>
            <button type="button" class="btn btn-ghost sm" @click="openSettings()">连接设置</button>
          </div>

          <div class="panel sidebar">
            <div class="panel-head">
              <div class="panel-title">
                <span>订阅</span>
                <span class="badge">{{ subs.length }}</span>
              </div>
              <div class="panel-actions">
                <button type="button" class="btn btn-ghost sm" :disabled="!subs.length" @click="unsubscribeAll">
                  全部取消
                </button>
                <button type="button" class="btn btn-ghost sm" @click="subModalOpen = true">批量</button>
              </div>
            </div>
            <div class="sub-quick">
              <input
                  v-model="subQuick"
                  class="inp grow"
                  placeholder="主题，如 sensor/+/temp"
                  @keydown.enter.prevent="quickSubscribe"
              />
              <select v-model.number="subQos" class="sel qos">
                <option :value="0">QoS 0</option>
                <option :value="1">QoS 1</option>
                <option :value="2">QoS 2</option>
              </select>
              <button type="button" class="btn sm" @click="quickSubscribe">订阅</button>
            </div>
            <div v-if="!subs.length" class="empty">
              <p class="empty-title">暂无订阅</p>
              <p class="empty-desc">上方快速订阅，或批量添加多个主题</p>
            </div>
            <div v-else class="sub-list">
              <button
                  type="button"
                  class="sub-item all"
                  :class="{ active: !filterTopic }"
                  @click="setFilter(null)"
              >
                <span class="sub-topic">全部主题</span>
              </button>
              <div
                  v-for="s in subs"
                  :key="s.topic"
                  class="sub-item"
                  :class="{ active: filterTopic === s.topic, pending: s.pending }"
                  :style="{ borderLeftColor: s.color }"
                  @click="setFilter(s.topic)"
              >
                <span class="sub-dot" :style="{ background: s.color }" aria-hidden="true"/>
                <span class="sub-topic" :title="s.topic">{{ s.topic }}</span>
                <span v-if="s.pending" class="pending-tag">待连接</span>
                <span class="qos-tag">Q{{ s.qos }}</span>
                <button type="button" class="icon-btn" title="取消订阅" @click.stop="unsubscribe(s.topic)">×</button>
              </div>
            </div>
          </div>

          <div class="block composer">
            <div class="panel-head compact">
              <div class="panel-title">
                发布
                <span class="muted">Ctrl/⌘ + Enter</span>
              </div>
            </div>
            <div class="row composer-row">
              <input
                  v-model="pubTopic"
                  class="inp grow"
                  placeholder="发布主题（不可含 + / #）"
                  @keydown.enter.prevent="publish"
              />
              <select v-model.number="pubQos" class="sel qos">
                <option :value="0">QoS 0</option>
                <option :value="1">QoS 1</option>
                <option :value="2">QoS 2</option>
              </select>
              <select v-model="pubFormat" class="sel fmt">
                <option value="text">Text</option>
                <option value="json">JSON</option>
                <option value="hex">Hex</option>
                <option value="base64">Base64</option>
              </select>
              <label class="check">
                <input v-model="pubRetain" type="checkbox"/>
                <span>Retain</span>
              </label>
              <button type="button" class="btn" :disabled="status !== 'connected'" @click="publish">发布</button>
            </div>
            <textarea
                v-model="pubPayload"
                class="ta mqtt-pub-body"
                rows="4"
                :placeholder="pubPlaceholder"
                @keydown="onPublishKeydown"
            />
          </div>

          <p class="hint footer-hint">
            仅支持 MQTT over WebSocket（ws:// / wss://）。预设可选是否保存密码，仅存本机（最多
            {{ MQTT_PRESET_MAX }} 个）。
          </p>
        </div>

        <aside class="panel main" aria-label="消息日志">
          <div class="panel-head">
            <div class="panel-title">
              <span>消息日志</span>
              <span class="muted mono">{{ filterTopic || '全部' }}</span>
              <span v-if="logs.length" class="badge soft">{{ filteredLogs.length }}/{{ logs.length }}</span>
            </div>
            <div class="panel-actions filters">
              <label class="check pin">
                <input v-model="autoScroll" type="checkbox"/>
                <span>钉底</span>
              </label>
              <select v-model="dirFilter" class="sel dir-sel">
                <option value="all">全部方向</option>
                <option value="in">仅收</option>
                <option value="out">仅发</option>
              </select>
              <input v-model="kwFilter" class="inp kw" placeholder="关键字"/>
              <button
                  v-if="kwFilter || dirFilter !== 'all' || filterTopic"
                  type="button"
                  class="btn btn-ghost sm"
                  @click="kwFilter = ''; dirFilter = 'all'; setFilter(null)"
              >
                重置
              </button>
            </div>
          </div>
          <div ref="logEl" class="log" @scroll="onLogScroll">
            <div v-if="!filteredLogs.length" class="empty log-empty">
              <p class="empty-title">{{ logs.length === 0 ? '等待消息' : '无匹配消息' }}</p>
              <p class="empty-desc">
                {{ logs.length === 0 ? '连接 Broker 并订阅主题后，收发消息将显示在这里' : '试试调整方向筛选或关键字' }}
              </p>
            </div>
            <div
                v-for="e in filteredLogs"
                :key="e.id"
                class="log-line"
                :class="e.dir"
                :style="borderColor(e) ? { borderLeftColor: borderColor(e) } : undefined"
            >
              <div class="log-head">
                <span class="dir-badge" :class="e.dir">{{
                    e.dir === 'in' ? 'IN' : e.dir === 'out' ? 'OUT' : 'SYS'
                  }}</span>
                <span v-if="e.topic" class="topic">{{ e.topic }}</span>
                <span v-if="e.dir !== 'system' && e.qos != null" class="meta">QoS {{ e.qos }}</span>
                <span v-if="e.retain" class="meta retain">retain</span>
                <span class="time">{{ e.time }}</span>
                <div class="log-actions">
                  <button
                      v-if="isPayloadLong(e)"
                      type="button"
                      class="btn btn-ghost xs"
                      @click="toggleLogExpand(e.id)"
                  >
                    {{ isLogExpanded(e.id) ? '收起' : '展开' }}
                  </button>
                  <button type="button" class="btn btn-ghost xs" @click="copyLogEntry(e)">复制</button>
                </div>
              </div>
              <pre class="body">{{ displayPayload(e) }}</pre>
            </div>
          </div>
        </aside>
      </div>

      <div v-if="settingsOpen" class="modal-backdrop" @click.self="closeSettings">
        <div class="modal settings-modal" role="dialog" aria-modal="true" aria-label="连接设置">
          <div class="modal-header">
            <span>连接设置</span>
            <button type="button" class="icon-btn" aria-label="关闭" @click="closeSettings">×</button>
          </div>
          <div class="modal-body">
            <p v-if="settingsLocked" class="lock-hint">已连接时修改需断开后重新连接才生效</p>
            <div class="preset-row">
              <span class="lbl">预设</span>
              <select v-model="selectedPresetId" class="sel grow" :disabled="settingsLocked">
                <option value="">选择预设…</option>
                <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <div class="preset-actions">
                <button type="button" class="btn btn-ghost sm" :disabled="settingsLocked" @click="applyPreset">应用
                </button>
                <button type="button" class="btn btn-ghost sm" :disabled="settingsLocked" @click="savePreset">保存
                </button>
                <button type="button" class="btn btn-ghost sm" :disabled="settingsLocked" @click="openPresetModal">
                  另存为
                </button>
                <button type="button" class="btn btn-ghost sm" :disabled="settingsLocked" @click="deletePreset">删除
                </button>
              </div>
            </div>

            <div class="tabs" role="tablist">
              <button
                  type="button"
                  class="tab"
                  role="tab"
                  :aria-selected="settingsTab === 'basic'"
                  :class="{ active: settingsTab === 'basic' }"
                  @click="settingsTab = 'basic'"
              >
                基础
              </button>
              <button
                  type="button"
                  class="tab"
                  role="tab"
                  :aria-selected="settingsTab === 'advanced'"
                  :class="{ active: settingsTab === 'advanced' }"
                  @click="settingsTab = 'advanced'"
              >
                高级
              </button>
            </div>

            <fieldset class="form" :disabled="settingsLocked">
              <div class="form-panels">
                <div
                  class="form-inner"
                  role="tabpanel"
                  :class="{ active: settingsTab === 'basic' }"
                  :aria-hidden="settingsTab !== 'basic'"
                >
                  <div class="grid2">
                    <label class="field">
                      <span class="lbl"><span class="req">*</span>名称</span>
                      <input v-model="connName" class="inp" placeholder="连接名称" />
                    </label>
                    <label class="field">
                      <span class="lbl"><span class="req">*</span>Client ID</span>
                      <div class="inline">
                        <input v-model="clientId" class="inp grow" placeholder="Client ID" />
                        <button type="button" class="btn btn-ghost sm" @click="randomClientId">随机</button>
                      </div>
                    </label>
                  </div>
                  <label class="field">
                    <span class="lbl"><span class="req">*</span>服务器地址</span>
                    <div class="inline">
                      <select v-model="scheme" class="sel scheme">
                        <option value="ws:">ws://</option>
                        <option value="wss:">wss://</option>
                      </select>
                      <input v-model="host" class="inp grow" placeholder="broker.emqx.io" />
                    </div>
                  </label>
                  <div class="row">
                    <label class="field">
                      <span class="lbl"><span class="req">*</span>端口</span>
                      <input v-model.number="port" class="inp port" type="number" min="1" max="65535" />
                    </label>
                    <label class="field grow">
                      <span class="lbl">路径</span>
                      <input v-model="path" class="inp" placeholder="/mqtt" />
                    </label>
                  </div>
                  <div class="row">
                    <label class="field grow">
                      <span class="lbl">用户名</span>
                      <input v-model="username" class="inp" placeholder="可选" />
                    </label>
                    <label class="field grow">
                      <span class="lbl">密码</span>
                      <div class="inline">
                        <input
                          v-model="password"
                          class="inp grow"
                          :type="showPassword ? 'text' : 'password'"
                          placeholder="可选"
                          autocomplete="off"
                        />
                        <button type="button" class="btn btn-ghost sm" @click="showPassword = !showPassword">
                          {{ showPassword ? '隐藏' : '显示' }}
                        </button>
                      </div>
                    </label>
                  </div>
                  <p class="url-preview">
                    连接 URL：
                    <code>{{ builtUrl.ok ? builtUrl.url : builtUrl.error || '—' }}</code>
                  </p>
                </div>

                <div
                  class="form-inner"
                  role="tabpanel"
                  :class="{ active: settingsTab === 'advanced' }"
                  :aria-hidden="settingsTab !== 'advanced'"
                >
                  <div class="row">
                    <label class="field">
                      <span class="lbl">MQTT 版本</span>
                      <select v-model.number="protocolVersion" class="sel">
                        <option :value="4">MQTT 3.1.1</option>
                        <option :value="5">MQTT 5.0</option>
                      </select>
                    </label>
                    <label class="field">
                      <span class="lbl">Keep Alive (s)</span>
                      <input v-model.number="keepalive" class="inp port" type="number" min="0" />
                    </label>
                    <label class="field">
                      <span class="lbl">连接超时 (s)</span>
                      <input v-model.number="connectTimeoutSec" class="inp port" type="number" min="1" />
                    </label>
                    <label class="check">
                      <input v-model="clean" type="checkbox" />
                      <span>Clean Session</span>
                    </label>
                  </div>
                  <div class="lwt">
                    <label class="check">
                      <input v-model="willEnabled" type="checkbox" />
                      <span>启用 LWT</span>
                    </label>
                    <input v-model="willTopic" class="inp grow" placeholder="LWT Topic" :disabled="!willEnabled" />
                    <input v-model="willPayload" class="inp grow" placeholder="LWT Payload" :disabled="!willEnabled" />
                    <select v-model.number="willQos" class="sel qos" :disabled="!willEnabled">
                      <option :value="0">QoS 0</option>
                      <option :value="1">QoS 1</option>
                      <option :value="2">QoS 2</option>
                    </select>
                    <label class="check">
                      <input v-model="willRetain" type="checkbox" :disabled="!willEnabled" />
                      <span>Retain</span>
                    </label>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" @click="closeSettings">关闭</button>
            <button
                type="button"
                class="btn"
                :disabled="!ready || status === 'connecting' || status === 'connected'"
                @click="connect"
            >
              连接
            </button>
          </div>
        </div>
      </div>

      <div v-if="subModalOpen" class="modal-backdrop" @click.self="subModalOpen = false">
        <div class="modal" role="dialog" aria-modal="true" aria-label="批量订阅">
          <div class="modal-header">
            <span>批量订阅</span>
            <button type="button" class="icon-btn" aria-label="关闭" @click="subModalOpen = false">×</button>
          </div>
          <div class="modal-body">
            <p class="hint">每行一个主题，也可用逗号 / 分号分隔。通配符：+ 单层，# 多层（须在末尾）。</p>
            <textarea
                v-model="subDraft"
                class="ta"
                rows="8"
                placeholder="sensor/+/temp&#10;device/#&#10;home/living/temp"
            />
            <label class="field qos-field">
              <span class="lbl">QoS</span>
              <select v-model.number="subQos" class="sel qos">
                <option :value="0">QoS 0</option>
                <option :value="1">QoS 1</option>
                <option :value="2">QoS 2</option>
              </select>
            </label>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" @click="subModalOpen = false">取消</button>
            <button type="button" class="btn" @click="doSubscribe">订阅</button>
          </div>
        </div>
      </div>

      <div v-if="presetModalOpen" class="modal-backdrop" @click.self="presetModalOpen = false">
        <div class="modal preset-modal" role="dialog" aria-modal="true" aria-label="保存预设">
          <div class="modal-header">
            <span>另存为预设</span>
            <button type="button" class="icon-btn" aria-label="关闭" @click="presetModalOpen = false">×</button>
          </div>
          <div class="modal-body">
            <label class="field">
              <span class="lbl">预设名称</span>
              <input
                  v-model="presetModalName"
                  class="inp"
                  placeholder="连接名称"
                  @keydown.enter.prevent="confirmSavePresetAs"
              />
            </label>
            <label class="check" style="margin-top: 10px">
              <input v-model="presetSavePassword" type="checkbox"/>
              <span>同时保存密码（仅存本机）</span>
            </label>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" @click="presetModalOpen = false">取消</button>
            <button type="button" class="btn" @click="confirmSavePresetAs">保存</button>
          </div>
        </div>
      </div>
    </UiToolShell>
    <template #fallback>
      <p class="hint fallback">正在加载 MQTT 客户端…</p>
    </template>
  </ClientOnly>
</template>

<style scoped>
.act-sep {
  width: 1px;
  height: 18px;
  background: var(--border);
  margin: 0 2px;
}

.mqtt-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(300px, 0.95fr);
  gap: 14px;
  flex: 1 1 auto;
  min-height: 0;
  align-self: stretch;
  height: 100%;
  align-items: stretch;
  width: 100%;
}

@media (max-width: 1100px) {
  .mqtt-layout {
    grid-template-columns: 1fr;
    height: auto;
    overflow: auto;
  }
}

.mqtt-side {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 2px;
}

.conn-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 0;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-soft);
  flex-wrap: wrap;
  flex-shrink: 0;
}

.conn-main {
  display: flex;
  gap: 10px;
  align-items: center;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.summary {
  flex: 1;
  min-width: 120px;
  font-size: 13px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono, ui-monospace, monospace);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background: var(--bg-panel);
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.status-pill .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.85;
}

.status-pill.connected {
  color: var(--success);
  background: color-mix(in srgb, var(--success) 12%, transparent);
  border-color: color-mix(in srgb, var(--success) 35%, transparent);
}

.status-pill.connecting {
  color: var(--warning);
  background: color-mix(in srgb, var(--warning) 12%, transparent);
  border-color: color-mix(in srgb, var(--warning) 35%, transparent);
}

.status-pill.connecting .dot {
  animation: pulse 1s ease-in-out infinite;
}

.status-pill.error,
.status-pill.offline {
  color: var(--danger);
  background: var(--danger-bg);
  border-color: var(--danger-border);
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
}

.stats {
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-mono, ui-monospace, monospace);
  white-space: nowrap;
}

.block {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 0;
  background: var(--bg-input, rgba(15, 23, 42, 0.35));
  flex-shrink: 0;
}

.lock-hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--warning);
}

.modal.settings-modal {
  width: min(960px, 96vw);
  max-height: min(90vh, 860px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal.settings-modal .modal-body {
  overflow: auto;
  flex: 1 1 auto;
  min-height: 0;
}

.form {
  border: none;
  margin: 0;
  padding: 0;
  min-width: 0;
}

.form:disabled {
  opacity: 0.72;
}

.form-panels {
  display: grid;
}
.form-panels > .form-inner {
  grid-area: 1 / 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  visibility: hidden;
  pointer-events: none;
}
.form-panels > .form-inner.active {
  visibility: visible;
  pointer-events: auto;
}

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 640px) {
  .grid2 {
    grid-template-columns: 1fr;
  }
}

.preset-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.preset-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tabs {
  display: inline-flex;
  gap: 2px;
  margin-bottom: 12px;
  padding: 3px;
  border-radius: 8px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
}

.tab {
  background: transparent;
  border: none;
  color: var(--text-muted);
  border-radius: 6px;
  padding: 5px 14px;
  font-size: 12px;
  cursor: pointer;
}

.tab.active {
  color: var(--text-strong);
  background: var(--brand-soft);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand) 40%, transparent);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lbl {
  font-size: 11px;
  color: var(--text-muted);
  margin: 0;
}

.req {
  color: var(--danger);
  margin-right: 2px;
}

.row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.inline {
  display: flex;
  gap: 8px;
  align-items: center;
}

.grow {
  flex: 1;
  min-width: 0;
}

.scheme {
  width: 90px;
  flex-shrink: 0;
}

.port {
  width: 100px;
}

.sel {
  width: 160px;
}

.qos {
  width: 90px;
}

.fmt {
  width: 100px;
}

.dir-sel {
  width: 110px;
}

.kw {
  width: 140px;
}

.check {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}

.url-preview {
  margin: 0;
  padding: 8px 10px;
  font-size: 12px;
  color: var(--text-muted);
  border-radius: 8px;
  background: var(--bg-soft);
  border: 1px dashed color-mix(in srgb, var(--brand) 30%, var(--border));
}

.url-preview code {
  color: var(--brand-strong);
  word-break: break-all;
}

.lwt {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 2px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.panel {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0;
  background: var(--bg-panel);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.panel.sidebar {
  flex: 1 1 auto;
  min-height: 180px;
}

.panel.main {
  min-height: 0;
  height: 100%;
  align-self: stretch;
}

.sub-quick {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.panel-head {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-soft);
}

.panel-head.compact {
  padding: 0 0 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border);
  background: transparent;
}

.panel-title {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 13px;
  font-weight: 600;
}

.panel-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--brand-strong);
  background: var(--brand-soft);
  border: 1px solid color-mix(in srgb, var(--brand) 30%, transparent);
}

.badge.soft {
  color: var(--text-muted);
  background: var(--bg-soft);
  border-color: var(--border);
}

.sub-list {
  flex: 1;
  overflow: auto;
  padding: 6px;
}

.sub-item {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  padding: 8px 8px;
  border-left: 3px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s ease;
}

.sub-item.all {
  border-left-color: transparent;
  margin-bottom: 2px;
}

.sub-item:hover {
  background: var(--brand-soft);
}

.sub-item.active {
  background: color-mix(in srgb, var(--brand) 16%, transparent);
}

.sub-item.pending {
  opacity: 0.78;
}

.pending-tag {
  font-size: 10px;
  font-weight: 600;
  color: var(--warning);
  padding: 1px 5px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--warning) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--warning) 35%, transparent);
  white-space: nowrap;
}

.sub-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sub-topic {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono, ui-monospace, monospace);
  text-align: left;
}

.qos-tag {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
}

.icon-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: var(--danger-bg);
  color: var(--danger);
}

.muted {
  color: var(--text-muted);
  font-weight: 400;
  font-size: 12px;
}

.mono {
  font-family: var(--font-mono, ui-monospace, monospace);
}

.hint {
  font-size: 12px;
  color: var(--text-muted);
  padding: 4px 0;
}

.footer-hint {
  margin: 0;
  line-height: 1.5;
}

.fallback {
  padding: 16px;
}

.sm {
  padding: 2px 8px;
  font-size: 0.75rem;
  min-height: 26px;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 28px 16px;
  text-align: center;
  flex: 1;
}

.empty-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
}

.empty-desc {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--text-muted);
  max-width: 260px;
  line-height: 1.5;
}

.log-empty {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}

.log {
  flex: 1 1 0;
  min-height: 0;
  max-height: none;
  height: auto;
  overflow: auto;
  display: flex;
  flex-direction: column;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 12px;
  padding: 8px;
  background: var(--bg-panel);
  border: none;
  border-radius: 0;
  white-space: normal;
}

.log-line {
  margin-bottom: 6px;
  padding: 8px 10px;
  border-left: 3px solid transparent;
  border-radius: 0 8px 8px 0;
  background: var(--bg-soft);
  white-space: pre-wrap;
  word-break: break-word;
}

.log-line:hover {
  background: color-mix(in srgb, var(--brand) 6%, var(--bg-soft));
}

.log-line.in {
  background: color-mix(in srgb, var(--success) 8%, transparent);
}

.log-line.out {
  background: color-mix(in srgb, var(--brand) 8%, transparent);
}

.log-line.system {
  color: var(--text-muted);
}

.log-head {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.log-actions {
  margin-left: auto;
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.xs {
  padding: 0 6px;
  font-size: 0.7rem;
  min-height: 22px;
}

.check.pin {
  margin-right: 2px;
}

.dir-badge {
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.04em;
  padding: 1px 6px;
  border-radius: 4px;
  line-height: 1.4;
}

.dir-badge.in {
  color: var(--success);
  background: color-mix(in srgb, var(--success) 15%, transparent);
}

.dir-badge.out {
  color: var(--brand-strong);
  background: var(--brand-soft);
}

.dir-badge.system {
  color: var(--text-muted);
  background: var(--bg-soft);
}

.topic {
  color: var(--text-strong);
  font-weight: 500;
}

.meta,
.time {
  color: var(--text-faint);
  font-size: 11px;
}

.meta.retain {
  color: var(--accent);
}

.body {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text);
  line-height: 1.45;
}

.composer .ta,
.composer .mqtt-pub-body {
  margin-top: 8px;
  width: 100%;
  min-height: 88px;
  resize: vertical;
}

.composer-row {
  align-items: stretch;
}

.preset-modal .field {
  width: 100%;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--bg) 35%, rgba(0, 0, 0, 0.55));
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
}

.modal {
  width: min(520px, 100%);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--shadow);
}

.modal-header,
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.modal-header {
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 14px;
}

.modal-footer {
  margin-top: 14px;
  justify-content: flex-end;
}

.modal-body .ta {
  width: 100%;
}

.qos-field {
  margin-top: 10px;
}
</style>
