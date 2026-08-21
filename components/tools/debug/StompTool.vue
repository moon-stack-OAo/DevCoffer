<script setup lang="ts">
import {
  STOMP_HEARTBEAT,
  stompEncode,
  stompParseExtraHeaders,
  stompPrettyBody,
  stompSplitBuffer,
  stompStatusLabel,
  type StompFrame,
  type StompLogEntry,
} from '#shared/debug/stomp'

const { error, setError, clearError } = useToolState()
const { copy } = useClipboard()

const url = ref('ws://localhost:61614/stomp')
const host = ref('localhost')
const heartbeat = ref('10000,10000')
const connHeaders = ref('login:guest\npasscode:guest')
const subDest = ref('/topic/messages')
const subAck = ref('auto')
const sendDest = ref('/topic/messages')
const sendCt = ref('application/json')
const sendHeaders = ref('')
const sendBody = ref('{"event":"ping"}')
const ackSubId = ref('')
const ackMsgId = ref('')

const status = ref<'idle' | 'connecting' | 'ws-open' | 'connected' | 'closed'>('idle')
const logs = ref<StompLogEntry[]>([])
const subs = ref<{ id: string; dest: string }[]>([])
const logEl = ref<HTMLElement | null>(null)
const settingsOpen = ref(false)
const autoScroll = ref(true)
const dirFilter = ref<'all' | 'in' | 'out' | 'system'>('all')
const kwFilter = ref('')
const filterSubId = ref<string | null>(null)
const expandedLogIds = ref<Record<number, boolean>>({})
let logSeq = 0
let subSeq = 0
let client: WebSocket | null = null
let connected = false
let buffer = ''
let hbTxTimer: ReturnType<typeof setInterval> | null = null
let hbRxTimer: ReturnType<typeof setInterval> | null = null
let lastRx = 0

const canConnect = computed(
  () => status.value !== 'connecting' && status.value !== 'ws-open' && status.value !== 'connected',
)
const canDisconnect = computed(
  () => status.value === 'connecting' || status.value === 'ws-open' || status.value === 'connected',
)
const settingsLocked = computed(
  () => status.value === 'connecting' || status.value === 'ws-open' || status.value === 'connected',
)
const statusPillClass = computed(() => {
  if (status.value === 'connected') return 'connected'
  if (status.value === 'ws-open' || status.value === 'connecting') return 'connecting'
  if (status.value === 'closed') return 'error'
  return 'disconnected'
})
const connSummary = computed(() => url.value.trim() || '未配置连接')

const filteredLogs = computed(() => {
  const dir = dirFilter.value
  const kw = kwFilter.value.trim().toLowerCase()
  const subId = filterSubId.value
  return logs.value.filter((l) => {
    if (dir !== 'all' && l.dir !== dir) return false
    if (subId) {
      const sid = l.headers?.subscription || l.headers?.id || ''
      const dest = l.headers?.destination || ''
      const hit =
        sid === subId ||
        (l.dir === 'out' && l.command === 'SUBSCRIBE' && l.headers?.id === subId) ||
        (l.dir === 'out' && l.command === 'UNSUBSCRIBE' && l.headers?.id === subId) ||
        (!!dest && subs.value.some((s) => s.id === subId && s.dest === dest))
      if (!hit && l.dir !== 'system') return false
      if (l.dir === 'system' && !String(l.text || '').includes(subId)) return false
    }
    if (!kw) return true
    const blob = [
      l.command,
      l.text,
      l.body,
      ...(l.headers ? Object.entries(l.headers).flatMap(([k, v]) => [k, v]) : []),
    ]
      .filter(Boolean)
      .join('\n')
      .toLowerCase()
    return blob.includes(kw)
  })
})

function now() {
  return new Date().toLocaleTimeString()
}

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
  autoScroll.value = el.scrollHeight - el.scrollTop - el.clientHeight < 48
}

function pushLog(entry: Omit<StompLogEntry, 'id' | 'time'> & { time?: string }) {
  logs.value.push({ id: ++logSeq, time: entry.time || now(), ...entry })
  if (logs.value.length > 500) logs.value = logs.value.slice(-400)
  scrollLogToBottom()
}

function logFrame(dir: 'in' | 'out', command: string, headers: Record<string, string>, body: string) {
  pushLog({ dir, command, headers: { ...headers }, body })
}

function logSys(text: string) {
  pushLog({ dir: 'system', text })
}

function stopHeartbeat() {
  if (hbTxTimer) {
    clearInterval(hbTxTimer)
    hbTxTimer = null
  }
  if (hbRxTimer) {
    clearInterval(hbRxTimer)
    hbRxTimer = null
  }
}

function startHeartbeat(cx: number, sy: number) {
  stopHeartbeat()
  lastRx = Date.now()
  if (cx > 0 && client && client.readyState === WebSocket.OPEN) {
    hbTxTimer = setInterval(() => {
      if (client && client.readyState === WebSocket.OPEN) {
        try {
          client.send(STOMP_HEARTBEAT)
        } catch {
          /* ignore */
        }
      }
    }, cx)
  }
  if (sy > 0) {
    const interval = Math.max(1000, Math.floor(sy / 2))
    hbRxTimer = setInterval(() => {
      if (!client) return
      if (Date.now() - lastRx > sy * 2) {
        logSys('心跳超时，关闭连接')
        try {
          client.close()
        } catch {
          /* ignore */
        }
      }
    }, interval)
  }
}

function dispatch(frame: StompFrame) {
  switch (frame.command) {
    case 'CONNECTED': {
      connected = true
      status.value = 'connected'
      const hb = (frame.headers['heart-beat'] || '0,0').split(',')
      const sy = parseInt(hb[1] || '0', 10) || 0
      const txParts = (heartbeat.value || '0,0').split(',')
      const tx = parseInt(txParts[0] || '0', 10) || 0
      startHeartbeat(tx, sy)
      logSys(
        'STOMP 已握手 (version=' +
          (frame.headers['version'] || '?') +
          ', session=' +
          (frame.headers['session'] || '-') +
          ')',
      )
      break
    }
    case 'MESSAGE': {
      const sub = frame.headers['subscription'] || '-'
      const dest = frame.headers['destination'] || ''
      const ct = frame.headers['content-type'] || ''
      const pretty = stompPrettyBody(frame.body || '', ct)
      logSys('订阅 ' + sub + ' · ' + dest + (ct ? ' [' + ct + ']' : '') + '\n' + pretty)
      if (frame.headers['message-id']) ackMsgId.value = frame.headers['message-id']
      if (frame.headers['subscription']) ackSubId.value = frame.headers['subscription']
      break
    }
    case 'ERROR': {
      const msg = frame.headers.message || frame.body || 'Unknown error'
      logSys('ERROR: ' + msg)
      setError(msg)
      try {
        client?.close()
      } catch {
        /* ignore */
      }
      break
    }
    case 'RECEIPT':
      logSys('RECEIPT ' + (frame.headers['receipt-id'] || ''))
      break
    default:
      break
  }
}

function handleIncoming(data: string) {
  buffer += data
  const { frames, rest } = stompSplitBuffer(buffer)
  buffer = rest
  for (const frame of frames) {
    logFrame('in', frame.command, frame.headers, frame.body)
    dispatch(frame)
  }
}

function openSettings() {
  settingsOpen.value = true
}

function closeSettings() {
  settingsOpen.value = false
}

function setFilter(id: string | null) {
  filterSubId.value = !id || id === filterSubId.value ? null : id
}

function connect() {
  clearError()
  const u = url.value.trim()
  if (!u) {
    setError('请输入 WebSocket URL')
    openSettings()
    return
  }
  disconnect(false)
  buffer = ''
  subs.value = []
  filterSubId.value = null
  status.value = 'connecting'
  try {
    client = new WebSocket(u)
  } catch (e) {
    setError('连接失败: ' + (e instanceof Error ? e.message : String(e)))
    status.value = 'idle'
    openSettings()
    return
  }
  client.onopen = () => {
    status.value = 'ws-open'
    closeSettings()
    logSys('WebSocket 已建立，发送 STOMP CONNECT')
    const headers: Record<string, string> = {
      'accept-version': '1.2',
      host: host.value.trim() || 'localhost',
      'heart-beat': heartbeat.value.trim() || '0,0',
    }
    Object.assign(headers, stompParseExtraHeaders(connHeaders.value))
    const frame = stompEncode('CONNECT', headers)
    logFrame('out', 'CONNECT', headers, '')
    try {
      client!.send(frame)
    } catch (e) {
      setError('发送失败: ' + (e instanceof Error ? e.message : String(e)))
    }
  }
  client.onmessage = (e) => {
    lastRx = Date.now()
    handleIncoming(typeof e.data === 'string' ? e.data : '')
  }
  client.onclose = (e) => {
    stopHeartbeat()
    status.value = 'closed'
    logSys(e && e.code !== 1000 ? '连接已断开 (code:' + e.code + ')' : '连接已断开')
    client = null
    connected = false
  }
  client.onerror = () => {
    logSys('连接错误')
  }
}

function disconnect(sendFrame = true) {
  stopHeartbeat()
  if (client) {
    if (sendFrame && connected) {
      try {
        const headers = { receipt: 'bye' }
        const frame = stompEncode('DISCONNECT', headers)
        logFrame('out', 'DISCONNECT', headers, '')
        client.send(frame)
      } catch {
        /* ignore */
      }
    }
    try {
      client.close()
    } catch {
      /* ignore */
    }
    client = null
  }
  connected = false
  status.value = 'closed'
  subs.value = []
}

function subscribe() {
  clearError()
  if (!connected || !client) {
    setError('STOMP 未连接')
    return
  }
  const dest = subDest.value.trim()
  if (!dest) {
    setError('请输入 destination')
    return
  }
  const id = 'sub-' + ++subSeq
  const headers: Record<string, string> = { id, destination: dest }
  if (subAck.value && subAck.value !== 'auto') headers.ack = subAck.value
  client.send(stompEncode('SUBSCRIBE', headers))
  logFrame('out', 'SUBSCRIBE', headers, '')
  subs.value = [...subs.value, { id, dest }]
}

function unsubscribe(id: string) {
  if (!connected || !client) return
  const headers = { id }
  client.send(stompEncode('UNSUBSCRIBE', headers))
  logFrame('out', 'UNSUBSCRIBE', headers, '')
  subs.value = subs.value.filter((s) => s.id !== id)
}

function send() {
  clearError()
  if (!connected || !client) {
    setError('STOMP 未连接')
    return
  }
  const dest = sendDest.value.trim()
  if (!dest) {
    setError('请输入 destination')
    return
  }
  const headers: Record<string, string> = { destination: dest }
  if (sendCt.value) headers['content-type'] = sendCt.value
  Object.assign(headers, stompParseExtraHeaders(sendHeaders.value))
  const body = sendBody.value
  client.send(stompEncode('SEND', headers, body))
  logFrame('out', 'SEND', headers, body)
}

function ackOrNack(action: 'ack' | 'nack') {
  clearError()
  if (!connected || !client) {
    setError('STOMP 未连接')
    return
  }
  const id = ackSubId.value.trim()
  const msgId = ackMsgId.value.trim()
  if (!id || !msgId) {
    setError('请填写 sub-id 和 message-id')
    return
  }
  const headers: Record<string, string> = { id, 'message-id': msgId }
  const cmd = action === 'nack' ? 'NACK' : 'ACK'
  client.send(stompEncode(cmd, headers))
  logFrame('out', cmd, headers, '')
}

function clearLogs() {
  logs.value = []
  expandedLogIds.value = {}
}

function frameText(entry: StompLogEntry): string {
  if (entry.dir === 'system') return '[' + entry.time + '] SYS ' + (entry.text || '')
  const lines = ['[' + entry.time + '] ' + (entry.dir === 'out' ? 'OUT' : 'IN') + ' ' + (entry.command || '')]
  if (entry.headers) {
    for (const [k, v] of Object.entries(entry.headers)) lines.push(k + ':' + v)
  }
  if (entry.body) lines.push('', entry.body)
  return lines.join('\n')
}

async function copyLogEntry(entry: StompLogEntry) {
  clearError()
  await copy(frameText(entry))
}

async function copyLogs() {
  const list = filteredLogs.value
  if (!list.length) {
    setError('没有日志可复制')
    return
  }
  clearError()
  await copy(list.map(frameText).join('\n\n'))
}

function isBodyLong(entry: StompLogEntry): boolean {
  return !!(entry.body && entry.body.length > 400)
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

function displayBody(entry: StompLogEntry): string {
  const body = entry.body || ''
  if (!body) return ''
  if (isLogExpanded(entry.id) || body.length <= 400) return body
  return body.slice(0, 400) + '…(' + body.length + ' chars)'
}

function onSendKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    send()
  }
}

function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && settingsOpen.value) settingsOpen.value = false
}

onMounted(() => {
  if (typeof window !== 'undefined') window.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onGlobalKeydown)
  disconnect(false)
})
</script>

<template>
  <UiToolShell title="STOMP 调试" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" :disabled="!canConnect" @click="connect">连接</button>
      <button type="button" class="btn btn-ghost" :disabled="!canDisconnect" @click="disconnect()">断开</button>
      <span class="act-sep" aria-hidden="true" />
      <button type="button" class="btn btn-ghost" :disabled="!logs.length" @click="clearLogs">清空</button>
      <button type="button" class="btn btn-ghost" :disabled="!filteredLogs.length" @click="copyLogs">复制</button>
    </template>

    <div class="stomp-layout">
      <div class="stomp-side">
        <div class="conn-bar">
          <div class="conn-main">
            <span class="status-pill" :class="statusPillClass">
              <span class="dot" aria-hidden="true" />
              {{ stompStatusLabel(status) }}
            </span>
            <div class="summary" :title="connSummary">{{ connSummary }}</div>
          </div>
          <button type="button" class="btn btn-ghost sm" @click="openSettings">连接设置</button>
        </div>

        <div class="panel sidebar">
          <div class="panel-head">
            <div class="panel-title">
              <span>订阅</span>
              <span class="badge">{{ subs.length }}</span>
            </div>
          </div>
          <div class="sub-quick">
            <input
              v-model="subDest"
              class="inp grow"
              placeholder="/topic/messages"
              @keydown.enter.prevent="subscribe"
            />
            <select v-model="subAck" class="sel ack-sel">
              <option value="auto">ack=auto</option>
              <option value="client">ack=client</option>
              <option value="client-individual">ack=client-individual</option>
            </select>
            <button type="button" class="btn sm" :disabled="status !== 'connected'" @click="subscribe">订阅</button>
          </div>
          <div v-if="!subs.length" class="empty">
            <p class="empty-title">暂无订阅</p>
            <p class="empty-desc">连接后添加 destination，可点击订阅项过滤日志</p>
          </div>
          <div v-else class="sub-list">
            <button
              type="button"
              class="sub-item all"
              :class="{ active: !filterSubId }"
              @click="setFilter(null)"
            >
              <span class="sub-topic">全部订阅</span>
            </button>
            <div
              v-for="s in subs"
              :key="s.id"
              class="sub-item"
              :class="{ active: filterSubId === s.id }"
              @click="setFilter(s.id)"
            >
              <code class="sub-id">{{ s.id }}</code>
              <span class="sub-topic" :title="s.dest">{{ s.dest }}</span>
              <button type="button" class="icon-btn" title="取消订阅" @click.stop="unsubscribe(s.id)">×</button>
            </div>
          </div>
        </div>

        <div class="block composer">
          <div class="panel-head compact">
            <div class="panel-title">
              发送
              <span class="muted">Ctrl/⌘ + Enter</span>
            </div>
          </div>
          <div class="row composer-row">
            <input v-model="sendDest" class="inp grow" placeholder="目标 destination" />
            <select v-model="sendCt" class="sel ct-sel">
              <option value="application/json">application/json</option>
              <option value="text/plain">text/plain</option>
              <option value="application/xml">application/xml</option>
              <option value="">不设置</option>
            </select>
            <button type="button" class="btn" :disabled="status !== 'connected'" @click="send">发送</button>
          </div>
          <label class="field">
            <span class="lbl">附加 Headers <span class="muted">每行 key:value</span></span>
            <input v-model="sendHeaders" class="inp" placeholder="receipt:123" />
          </label>
          <textarea
            v-model="sendBody"
            class="ta stomp-body"
            rows="4"
            placeholder='{"event":"ping"}'
            @keydown="onSendKeydown"
          />
        </div>

        <div class="block ack-block">
          <div class="panel-head compact">
            <div class="panel-title">
              ACK / NACK
              <span class="muted">仅 ack=client / client-individual</span>
            </div>
          </div>
          <div class="row">
            <input v-model="ackSubId" class="inp ack-id" placeholder="sub-id" />
            <input v-model="ackMsgId" class="inp grow" placeholder="message-id" />
            <button type="button" class="btn sm" :disabled="status !== 'connected'" @click="ackOrNack('ack')">ACK</button>
            <button type="button" class="btn btn-ghost sm" :disabled="status !== 'connected'" @click="ackOrNack('nack')">NACK</button>
          </div>
        </div>

        <p class="hint footer-hint">仅支持 STOMP over WebSocket（ws:// / wss://）；握手参数在「连接设置」中配置。</p>
      </div>

      <aside class="panel main" aria-label="帧日志">
        <div class="panel-head">
          <div class="panel-title">
            <span>帧日志</span>
            <span v-if="logs.length" class="badge soft">{{ filteredLogs.length }}/{{ logs.length }}</span>
          </div>
          <div class="panel-actions filters">
            <label class="check pin">
              <input v-model="autoScroll" type="checkbox" />
              <span>钉底</span>
            </label>
            <select v-model="dirFilter" class="sel dir-sel">
              <option value="all">全部方向</option>
              <option value="in">仅收</option>
              <option value="out">仅发</option>
              <option value="system">仅系统</option>
            </select>
            <input v-model="kwFilter" class="inp kw" placeholder="关键字" />
            <button
              v-if="kwFilter || dirFilter !== 'all' || filterSubId"
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
            <p class="empty-title">{{ logs.length === 0 ? '等待帧日志' : '无匹配日志' }}</p>
            <p class="empty-desc">
              {{ logs.length === 0 ? '连接后显示原始 STOMP 帧（CONNECT / MESSAGE / ERROR…）' : '试试调整方向筛选或关键字' }}
            </p>
          </div>
          <div
            v-for="l in filteredLogs"
            :key="l.id"
            class="log-line"
            :class="l.dir"
          >
            <div class="log-head">
              <span class="dir-badge" :class="l.dir">{{ l.dir === 'in' ? 'IN' : l.dir === 'out' ? 'OUT' : 'SYS' }}</span>
              <span v-if="l.command" class="cmd">{{ l.command }}</span>
              <span v-if="l.headers?.destination" class="topic">{{ l.headers.destination }}</span>
              <span class="time">{{ l.time }}</span>
              <div class="log-actions">
                <button
                  v-if="isBodyLong(l)"
                  type="button"
                  class="btn btn-ghost xs"
                  @click="toggleLogExpand(l.id)"
                >
                  {{ isLogExpanded(l.id) ? '收起' : '展开' }}
                </button>
                <button type="button" class="btn btn-ghost xs" @click="copyLogEntry(l)">复制</button>
              </div>
            </div>
            <template v-if="l.dir === 'system'">
              <pre class="body">{{ l.text }}</pre>
            </template>
            <template v-else>
              <div v-if="l.headers && Object.keys(l.headers).length" class="headers">
                <div v-for="(v, k) in l.headers" :key="k" class="h-row">
                  <span class="hk">{{ k }}</span>: <span class="hv">{{ v }}</span>
                </div>
              </div>
              <pre v-if="l.body" class="body">{{ displayBody(l) }}</pre>
            </template>
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
          <fieldset class="form" :disabled="settingsLocked">
            <label class="field">
              <span class="lbl"><span class="req">*</span>WebSocket URL</span>
              <input
                v-model="url"
                class="inp"
                placeholder="ws://localhost:61614/stomp"
                @keydown.enter.prevent="connect"
              />
            </label>
            <div class="row">
              <label class="field grow">
                <span class="lbl">Host</span>
                <input v-model="host" class="inp" placeholder="localhost" />
              </label>
              <label class="field grow">
                <span class="lbl">心跳 (cx,cy) ms</span>
                <input v-model="heartbeat" class="inp" placeholder="10000,10000" />
              </label>
            </div>
            <label class="field">
              <span class="lbl">CONNECT Headers <span class="muted">每行 key:value</span></span>
              <textarea
                v-model="connHeaders"
                class="ta"
                rows="5"
                placeholder="login:guest&#10;passcode:guest"
              />
            </label>
          </fieldset>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" @click="closeSettings">关闭</button>
          <button type="button" class="btn" :disabled="!canConnect" @click="connect">连接</button>
        </div>
      </div>
    </div>
  </UiToolShell>
</template>

<style scoped>
.act-sep {
  width: 1px;
  height: 18px;
  background: var(--border);
  margin: 0 2px;
}
.stomp-layout {
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
  .stomp-layout {
    grid-template-columns: 1fr;
    height: auto;
    overflow: auto;
  }
}
.stomp-side {
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
.status-pill.error {
  color: var(--danger);
  background: var(--danger-bg);
  border-color: var(--danger-border);
}
@keyframes pulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}
.block {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  background: var(--bg-input, rgba(15, 23, 42, 0.35));
  flex-shrink: 0;
}
.panel {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-panel);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.panel.sidebar {
  flex: 1 1 auto;
  min-height: 160px;
}
.panel.main {
  min-height: 0;
  height: 100%;
  align-self: stretch;
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
.sub-quick {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
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
  padding: 8px;
  border-left: 3px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s ease;
}
.sub-item.all {
  margin-bottom: 2px;
}
.sub-item:hover {
  background: var(--brand-soft);
}
.sub-item.active {
  background: color-mix(in srgb, var(--brand) 16%, transparent);
}
.sub-id {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px;
  color: var(--brand-strong);
  background: var(--brand-soft);
  padding: 1px 6px;
  border-radius: 4px;
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
.row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.grow {
  flex: 1;
  min-width: 0;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
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
.muted {
  color: var(--text-muted);
  font-weight: 400;
  font-size: 12px;
}
.hint {
  font-size: 12px;
  color: var(--text-muted);
}
.footer-hint {
  margin: 0;
  line-height: 1.5;
}
.sm {
  padding: 2px 8px;
  font-size: 0.75rem;
  min-height: 26px;
}
.xs {
  padding: 0 6px;
  font-size: 0.7rem;
  min-height: 22px;
}
.ack-sel,
.ct-sel {
  width: 180px;
  flex-shrink: 0;
}
.ack-id {
  width: 120px;
  flex-shrink: 0;
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
.composer-row {
  align-items: stretch;
}
.composer .ta,
.composer .stomp-body {
  margin-top: 8px;
  width: 100%;
  min-height: 88px;
  resize: vertical;
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
  margin: 0;
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
  border-left-color: var(--success);
}
.log-line.out {
  background: color-mix(in srgb, var(--brand) 8%, transparent);
  border-left-color: var(--brand);
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
.cmd {
  font-weight: 700;
  color: var(--text-strong);
}
.topic {
  color: var(--text-strong);
  font-weight: 500;
}
.time {
  color: var(--text-faint);
  font-size: 11px;
}
.headers {
  margin: 2px 0 4px;
}
.h-row {
  color: var(--text-muted);
  line-height: 1.4;
}
.hk {
  color: color-mix(in srgb, var(--brand) 70%, var(--text));
}
.hv {
  color: var(--text);
}
.body {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text);
  line-height: 1.45;
  font-family: inherit;
  font-size: inherit;
}
.lock-hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--warning);
}
.form {
  border: none;
  margin: 0;
  padding: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.form:disabled {
  opacity: 0.72;
}
.form .field {
  margin-top: 0;
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
.modal.settings-modal {
  width: min(720px, 96vw);
  max-height: min(90vh, 760px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal.settings-modal .modal-body {
  overflow: auto;
  flex: 1 1 auto;
  min-height: 0;
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
</style>
