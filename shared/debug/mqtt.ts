/** MQTT 调试：URL/主题校验、payload 编解码、预设 CRUD、日志过滤导出 */

export const MQTT_LOG_MAX = 500
export const MQTT_PREVIEW_LEN = 400
export const MQTT_PRESET_MAX = 5
export const MQTT_PRESET_KEY = 'devcoffer_mqtt_presets'
export const MQTT_PRESET_KEY_LEGACY = 'codedeck_mqtt_presets'

export const MQTT_TOPIC_COLORS = [
  '#34d399',
  '#60a5fa',
  '#f472b6',
  '#fbbf24',
  '#a78bfa',
  '#fb7185',
  '#22d3ee',
  '#c084fc',
] as const

export type MqttPayloadFormat = 'text' | 'json' | 'hex' | 'base64'
export type MqttLogDir = 'in' | 'out' | 'system'
export type MqttStatusKind = 'disconnected' | 'connecting' | 'connected' | 'error' | 'offline'

export interface MqttWillConfig {
  enabled: boolean
  topic: string
  payload: string
  qos: 0 | 1 | 2
  retain: boolean
}

export interface MqttPreset {
  id: string
  name: string
  url: string
  clientId: string
  username: string
  password: string
  protocolVersion: 4 | 5
  clean: boolean
  keepalive: number
  connectTimeoutSec: number
  will: MqttWillConfig
}

export interface MqttBrokerParts {
  scheme: 'ws:' | 'wss:'
  host: string
  port: number
  path: string
}

export interface MqttLogEntry {
  id: number
  dir: MqttLogDir
  time: string
  topic: string
  qos?: number
  retain?: boolean
  payload: string
  message: string
  format?: string
}

export interface MqttStats {
  connectedAt: number | null
  stoppedAt?: number | null
  recv: number
  sent: number
  recvBytes: number
  sentBytes: number
}

export interface MqttSubItem {
  topic: string
  qos: 0 | 1 | 2
  color: string
  pending?: boolean
}

export function mqttColorForIndex(i: number): string {
  const n = MQTT_TOPIC_COLORS.length
  const idx = (((Number(i) || 0) % n) + n) % n
  return MQTT_TOPIC_COLORS[idx]
}

export function mqttNormalizePreset(raw: unknown): MqttPreset | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const url = r.url !== undefined && r.url !== null ? String(r.url).trim() : ''
  if (!url) return null
  let name = r.name !== undefined && r.name !== null ? String(r.name).trim() : ''
  if (!name) {
    try {
      name = new URL(url).hostname || url
    } catch {
      name = url
    }
  }
  const id =
    r.id !== undefined && r.id !== null && String(r.id).trim() !== ''
      ? String(r.id)
      : String(Date.now())
  let protocolVersion: 4 | 5 = 5
  if (parseInt(String(r.protocolVersion), 10) === 4) protocolVersion = 4
  let keepalive = 60
  const ka = parseInt(String(r.keepalive), 10)
  if (!isNaN(ka) && ka >= 0) keepalive = ka
  let connectTimeoutSec = 30
  const ct = parseInt(String(r.connectTimeoutSec), 10)
  if (!isNaN(ct) && ct > 0) connectTimeoutSec = ct
  const willRaw =
    r.will && typeof r.will === 'object' ? (r.will as Record<string, unknown>) : {}
  let willQos: 0 | 1 | 2 = 0
  const wq = parseInt(String(willRaw.qos), 10)
  if (wq === 1 || wq === 2) willQos = wq
  return {
    id,
    name,
    url,
    clientId: r.clientId !== undefined && r.clientId !== null ? String(r.clientId) : '',
    username: r.username !== undefined && r.username !== null ? String(r.username) : '',
    password: r.password !== undefined && r.password !== null ? String(r.password) : '',
    protocolVersion,
    clean: r.clean === undefined ? true : !!r.clean,
    keepalive,
    connectTimeoutSec,
    will: {
      enabled: !!willRaw.enabled,
      topic: willRaw.topic !== undefined && willRaw.topic !== null ? String(willRaw.topic) : '',
      payload:
        willRaw.payload !== undefined && willRaw.payload !== null ? String(willRaw.payload) : '',
      qos: willQos,
      retain: !!willRaw.retain,
    },
  }
}

export function mqttUpsertPreset(list: MqttPreset[] | unknown, preset: unknown): MqttPreset[] {
  const src = Array.isArray(list) ? (list as MqttPreset[]).slice() : []
  const p = mqttNormalizePreset(preset)
  if (!p) return src
  const idx = src.findIndex((x) => x && String(x.id) === p.id)
  if (idx >= 0) src[idx] = p
  else src.unshift(p)
  return src.length > MQTT_PRESET_MAX ? src.slice(0, MQTT_PRESET_MAX) : src
}

export function mqttRemovePreset(list: MqttPreset[] | unknown, id: unknown): MqttPreset[] {
  const src = Array.isArray(list) ? (list as MqttPreset[]) : []
  const sid = id === undefined || id === null ? '' : String(id)
  return src.filter((p) => p && String(p.id) !== sid)
}

export function mqttSerializePresets(list: MqttPreset[] | unknown): string {
  const src = Array.isArray(list) ? (list as unknown[]) : []
  const out: MqttPreset[] = []
  for (const item of src) {
    const p = mqttNormalizePreset(item)
    if (p) out.push(p)
  }
  return JSON.stringify(out.length > MQTT_PRESET_MAX ? out.slice(0, MQTT_PRESET_MAX) : out)
}

export function mqttParsePresets(jsonStr: unknown): MqttPreset[] {
  if (jsonStr === undefined || jsonStr === null || String(jsonStr).trim() === '') return []
  try {
    const parsed = JSON.parse(String(jsonStr))
    if (!Array.isArray(parsed)) return []
    const out: MqttPreset[] = []
    for (const item of parsed) {
      const p = mqttNormalizePreset(item)
      if (p) out.push(p)
    }
    return out.length > MQTT_PRESET_MAX ? out.slice(0, MQTT_PRESET_MAX) : out
  } catch {
    return []
  }
}

export function mqttLoadPresetsFromStorage(): MqttPreset[] {
  try {
    if (typeof localStorage === 'undefined') return []
    const primary = localStorage.getItem(MQTT_PRESET_KEY)
    if (primary != null && String(primary).trim() !== '') {
      return mqttParsePresets(primary)
    }
    const legacy = localStorage.getItem(MQTT_PRESET_KEY_LEGACY)
    if (legacy != null && String(legacy).trim() !== '') {
      return mqttParsePresets(legacy)
    }
    return []
  } catch {
    return []
  }
}

export function mqttPersistPresets(list: MqttPreset[] | unknown): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(MQTT_PRESET_KEY, mqttSerializePresets(list))
  } catch {
    /* ignore quota / private mode */
  }
}

export function mqttFormatDuration(ms: number): string {
  let n = Number(ms)
  if (!isFinite(n) || n < 0) n = 0
  const total = Math.floor(n / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (x: number) => (x < 10 ? '0' + x : String(x))
  return pad(h) + ':' + pad(m) + ':' + pad(s)
}

export function mqttFormatBytes(n: number): string {
  const num = Number(n)
  if (!isFinite(num) || num < 0) return '0 B'
  if (num < 1024) return Math.round(num) + ' B'
  if (num < 1024 * 1024) return (num / 1024).toFixed(1) + ' KB'
  return (num / 1024 / 1024).toFixed(2) + ' MB'
}

export function mqttStatsText(stats: MqttStats | null | undefined, now?: number): string {
  const s = stats || ({} as MqttStats)
  const recv = Number(s.recv) || 0
  const sent = Number(s.sent) || 0
  const bytes = (Number(s.recvBytes) || 0) + (Number(s.sentBytes) || 0)
  let dur = '00:00:00'
  if (s.connectedAt != null) {
    const end =
      s.stoppedAt != null
        ? Number(s.stoppedAt)
        : typeof now === 'number'
          ? now
          : Date.now()
    dur = mqttFormatDuration(end - Number(s.connectedAt))
  }
  return '↑' + sent + ' ↓' + recv + ' · ' + mqttFormatBytes(bytes) + ' · ' + dur
}

export function mqttBuildExport(
  logs: MqttLogEntry[] | unknown,
  meta?: { exportedAt?: string; filter?: Record<string, unknown>; stats?: Record<string, unknown> },
) {
  const m = meta || {}
  return {
    exportedAt: m.exportedAt || new Date().toISOString(),
    filter: m.filter || {},
    stats: m.stats || {},
    messages: Array.isArray(logs) ? logs : [],
  }
}

/** MQTT 通配：+ 单层，# 多层（须在末尾）；空/null 过滤视为匹配全部 */
export function mqttTopicMatchesFilter(msgTopic: unknown, filterTopic: unknown): boolean {
  if (filterTopic === undefined || filterTopic === null || String(filterTopic).trim() === '') {
    return true
  }
  const filter = String(filterTopic)
  const topic = msgTopic === undefined || msgTopic === null ? '' : String(msgTopic)
  if (topic === filter) return true

  if (topic.charAt(0) === '$') {
    const first = filter.split('/')[0]
    if (first === '#' || first === '+') return false
  }

  const fParts = filter.split('/')
  const tParts = topic.split('/')
  for (let i = 0; i < fParts.length; i++) {
    const fp = fParts[i]
    if (fp === '#') return true
    if (i >= tParts.length) return false
    if (fp === '+') continue
    if (fp !== tParts[i]) return false
  }
  return fParts.length === tParts.length
}

export function mqttFilterLogs(
  logs: MqttLogEntry[] | unknown,
  opts?: { topic?: string | null; dir?: string; keyword?: string },
): MqttLogEntry[] {
  const o = opts || {}
  const src = Array.isArray(logs) ? (logs as MqttLogEntry[]) : []
  const topic = o.topic
  const dir = o.dir || 'all'
  const hasTopic = topic !== undefined && topic !== null && String(topic).trim() !== ''
  const kw =
    o.keyword !== undefined && o.keyword !== null ? String(o.keyword).trim().toLowerCase() : ''
  const out: MqttLogEntry[] = []
  for (const e of src) {
    if (!e) continue
    if (dir === 'in' || dir === 'out') {
      if (e.dir !== dir) continue
    }
    if (hasTopic) {
      if (e.dir === 'system') continue
      if (!mqttTopicMatchesFilter(e.topic, topic)) continue
    }
    if (kw) {
      const hay = String(e.payload || '') + '\0' + String(e.topic || '') + '\0' + String(e.message || '')
      if (hay.toLowerCase().indexOf(kw) === -1) continue
    }
    out.push(e)
  }
  return out
}

export function mqttPrettyPayload(text: unknown): { json: boolean; text: string } {
  const raw = text === undefined || text === null ? '' : String(text)
  const trimmed = raw.trim()
  if (!trimmed) return { json: false, text: raw }
  try {
    const obj = JSON.parse(trimmed)
    return { json: true, text: JSON.stringify(obj, null, 2) }
  } catch {
    return { json: false, text: raw }
  }
}

export function mqttGenClientId(): string {
  const rand = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
  return 'devcoffer-' + rand
}

export function mqttValidateBrokerUrl(
  url: unknown,
): { ok: true; normalized: string } | { ok: false; error: string } {
  if (url === undefined || url === null || String(url).trim() === '') {
    return { ok: false, error: '请输入 Broker URL' }
  }
  const raw = String(url).trim()
  const lower = raw.toLowerCase()
  if (lower.indexOf('mqtt://') === 0 || lower.indexOf('mqtts://') === 0) {
    return { ok: false, error: '浏览器仅支持 WebSocket，请使用 ws:// 或 wss://' }
  }
  if (lower.indexOf('tcp://') === 0 || lower.indexOf('ssl://') === 0) {
    return { ok: false, error: '不支持 tcp/ssl 直连，请使用 ws:// 或 wss://' }
  }
  if (lower.indexOf('ws://') !== 0 && lower.indexOf('wss://') !== 0) {
    return { ok: false, error: 'URL 须以 ws:// 或 wss:// 开头' }
  }
  try {
    const u = new URL(raw)
    if (u.protocol !== 'ws:' && u.protocol !== 'wss:') {
      return { ok: false, error: '仅允许 ws: / wss: 协议' }
    }
    if (!u.hostname) {
      return { ok: false, error: 'URL 缺少主机名' }
    }
    return { ok: true, normalized: u.href }
  } catch {
    return { ok: false, error: 'URL 格式无效' }
  }
}

export function mqttBuildBrokerUrl(parts: {
  scheme?: string
  host?: unknown
  port?: unknown
  path?: unknown
}):
  | { ok: true; url: string; scheme: string; host: string; port: number; path: string }
  | { ok: false; error: string; url: string } {
  const p = parts || {}
  const scheme = p.scheme === 'wss:' || p.scheme === 'wss' ? 'wss:' : 'ws:'
  const host = p.host !== undefined && p.host !== null ? String(p.host).trim() : ''
  if (!host) {
    return { ok: false, error: '请输入服务器地址', url: '' }
  }
  if (/[\s/]/.test(host) || host.indexOf(':') !== -1) {
    return { ok: false, error: '主机名不能包含空格、/ 或端口（端口请单独填写）', url: '' }
  }
  const portNum = parseInt(String(p.port), 10)
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return { ok: false, error: '端口须为 1–65535', url: '' }
  }
  let path = p.path !== undefined && p.path !== null ? String(p.path).trim() : ''
  if (!path) path = '/'
  if (path.charAt(0) !== '/') path = '/' + path
  const url = scheme + '//' + host + ':' + portNum + path
  const v = mqttValidateBrokerUrl(url)
  if (!v.ok) return { ok: false, error: v.error, url }
  return { ok: true, url, scheme, host, port: portNum, path }
}

export function mqttParseBrokerUrl(url: unknown): MqttBrokerParts & {
  ok: boolean
  error?: string
  url?: string
} {
  const v = mqttValidateBrokerUrl(url)
  if (!v.ok) {
    return {
      ok: false,
      error: v.error,
      scheme: 'ws:',
      host: '',
      port: 8083,
      path: '/mqtt',
    }
  }
  try {
    const u = new URL(v.normalized)
    const port = u.port ? parseInt(u.port, 10) : u.protocol === 'wss:' ? 443 : 80
    let path = u.pathname || '/'
    if (u.search) path += u.search
    return {
      ok: true,
      scheme: u.protocol === 'wss:' ? 'wss:' : 'ws:',
      host: u.hostname,
      port,
      path: path || '/',
      url: v.normalized,
    }
  } catch {
    return {
      ok: false,
      error: 'URL 格式无效',
      scheme: 'ws:',
      host: '',
      port: 8083,
      path: '/mqtt',
    }
  }
}

export function mqttValidateTopic(
  topic: unknown,
  forSubscribe: boolean,
): { ok: true; topic: string } | { ok: false; error: string } {
  if (topic === undefined || topic === null || String(topic).trim() === '') {
    return { ok: false, error: '请输入主题' }
  }
  const t = String(topic).trim()
  if (t.indexOf('\0') !== -1) {
    return { ok: false, error: '主题不能包含空字符' }
  }
  if (t.length > 65535) {
    return { ok: false, error: '主题过长' }
  }
  if (!forSubscribe) {
    if (t.indexOf('+') !== -1 || t.indexOf('#') !== -1) {
      return { ok: false, error: '发布主题不能包含通配符 + 或 #' }
    }
  } else {
    const parts = t.split('/')
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]
      if (p.indexOf('+') !== -1 && p !== '+') {
        return { ok: false, error: '通配符 + 须单独占一层' }
      }
      if (p.indexOf('#') !== -1) {
        if (p !== '#') {
          return { ok: false, error: '通配符 # 须单独占一层' }
        }
        if (i !== parts.length - 1) {
          return { ok: false, error: '通配符 # 只能出现在主题末尾' }
        }
      }
    }
  }
  return { ok: true, topic: t }
}

export function mqttParseSubTopics(text: unknown): {
  ok: boolean
  error?: string
  topics: string[]
  invalid?: string[]
  skippedInvalid?: number
} {
  if (text === undefined || text === null || String(text).trim() === '') {
    return { ok: false, error: '请输入主题', topics: [] }
  }
  const raw = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const parts = raw.split(/[\n,;]+/)
  const topics: string[] = []
  const seen: Record<string, boolean> = {}
  const invalid: string[] = []
  for (const piece0 of parts) {
    const piece = piece0.trim()
    if (!piece) continue
    const v = mqttValidateTopic(piece, true)
    if (!v.ok) {
      invalid.push(piece + '（' + v.error + '）')
      continue
    }
    if (seen[v.topic]) continue
    seen[v.topic] = true
    topics.push(v.topic)
  }
  if (invalid.length > 0 && topics.length === 0) {
    return { ok: false, error: '主题无效: ' + invalid[0], topics: [], invalid }
  }
  if (topics.length === 0) {
    return { ok: false, error: '请输入主题', topics: [] }
  }
  return {
    ok: true,
    topics,
    invalid,
    skippedInvalid: invalid.length,
  }
}

export function mqttFormatPayloadPreview(payload: unknown, maxLen?: number): string {
  const s = payload === undefined || payload === null ? '' : String(payload)
  const n = typeof maxLen === 'number' && maxLen > 0 ? maxLen : 200
  if (s.length <= n) return s
  return s.slice(0, n) + '…(' + s.length + ' chars)'
}

export function mqttLogLineText(entry: MqttLogEntry | null | undefined): string {
  if (!entry) return ''
  const dirLabel = entry.dir === 'in' ? 'IN' : entry.dir === 'out' ? 'OUT' : 'SYS'
  const parts = ['[' + (entry.time || '') + ']', dirLabel]
  if (entry.topic) parts.push('topic=' + entry.topic)
  if (entry.qos !== undefined && entry.qos !== null && entry.dir !== 'system') {
    parts.push('qos=' + entry.qos)
  }
  if (entry.retain) parts.push('retain')
  if (entry.payload !== undefined && entry.payload !== null && entry.payload !== '') {
    parts.push(entry.payload)
  } else if (entry.message) {
    parts.push(entry.message)
  }
  return parts.join(' ')
}

export function mqttUtf8ByteLength(str: unknown): number {
  if (str === undefined || str === null || str === '') return 0
  try {
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(String(str)).length
    }
  } catch {
    /* fallthrough */
  }
  return String(str).length
}

export function mqttEncodePublishPayload(
  raw: unknown,
  format: unknown,
):
  | {
      ok: true
      format: MqttPayloadFormat
      data: string | Uint8Array
      logText: string
      bytes: number
    }
  | { ok: false; error: string } {
  const text = raw === undefined || raw === null ? '' : String(raw)
  const fmt = (format ? String(format).toLowerCase() : 'text') as string
  if (fmt === 'json') {
    const trimmed = text.trim()
    if (!trimmed) {
      return { ok: false, error: 'JSON Payload 不能为空' }
    }
    try {
      const obj = JSON.parse(trimmed)
      const compact = JSON.stringify(obj)
      return {
        ok: true,
        format: 'json',
        data: compact,
        logText: compact,
        bytes: mqttUtf8ByteLength(compact),
      }
    } catch (e) {
      return {
        ok: false,
        error: 'JSON 无效: ' + (e instanceof Error ? e.message : String(e)),
      }
    }
  }
  if (fmt === 'hex') {
    const hex = text.replace(/\s+/g, '').replace(/^0x/i, '')
    if (!hex) {
      return { ok: true, format: 'hex', data: new Uint8Array(0), logText: '', bytes: 0 }
    }
    if (hex.length % 2 !== 0) {
      return { ok: false, error: 'Hex 长度须为偶数' }
    }
    if (!/^[0-9a-fA-F]+$/.test(hex)) {
      return { ok: false, error: 'Hex 仅允许 0-9 a-f' }
    }
    const arr = new Uint8Array(hex.length / 2)
    for (let i = 0; i < arr.length; i++) {
      arr[i] = parseInt(hex.substr(i * 2, 2), 16)
    }
    return {
      ok: true,
      format: 'hex',
      data: arr,
      logText: '[hex] ' + hex.toLowerCase(),
      bytes: arr.length,
    }
  }
  if (fmt === 'base64') {
    const b64 = text.replace(/\s+/g, '')
    if (!b64) {
      return { ok: true, format: 'base64', data: new Uint8Array(0), logText: '', bytes: 0 }
    }
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64) || b64.length % 4 !== 0) {
      return { ok: false, error: 'Base64 格式无效' }
    }
    try {
      if (typeof atob !== 'function') {
        return { ok: false, error: '当前环境不支持 Base64 解码' }
      }
      const s = atob(b64)
      const bin = new Uint8Array(s.length)
      for (let j = 0; j < s.length; j++) bin[j] = s.charCodeAt(j)
      return {
        ok: true,
        format: 'base64',
        data: bin,
        logText: '[base64] ' + b64,
        bytes: bin.length,
      }
    } catch {
      return { ok: false, error: 'Base64 解码失败' }
    }
  }
  return {
    ok: true,
    format: 'text',
    data: text,
    logText: text,
    bytes: mqttUtf8ByteLength(text),
  }
}

export function mqttPubFormatPlaceholder(format: unknown): string {
  const fmt = format ? String(format).toLowerCase() : 'text'
  if (fmt === 'json') return '{"msg":"hello","ts":1700000000}'
  if (fmt === 'hex') return '48656c6c6f  或  0x48656c6c6f'
  if (fmt === 'base64') return 'SGVsbG8='
  return 'Payload 文本'
}

export function mqttPayloadToString(payload: unknown): string {
  if (payload === undefined || payload === null) return ''
  if (typeof payload === 'string') return payload
  if (payload instanceof Uint8Array || (payload && (payload as { buffer?: ArrayBuffer }).buffer instanceof ArrayBuffer)) {
    try {
      if (typeof TextDecoder !== 'undefined') {
        return new TextDecoder('utf-8', { fatal: false }).decode(payload as Uint8Array)
      }
    } catch {
      /* fallthrough */
    }
    const arr = payload instanceof Uint8Array ? payload : new Uint8Array(payload as ArrayBuffer)
    const hex: string[] = []
    const max = Math.min(arr.length, 64)
    for (let i = 0; i < max; i++) {
      hex.push(('0' + arr[i].toString(16)).slice(-2))
    }
    return '[hex] ' + hex.join(' ') + (arr.length > max ? ' …' : '')
  }
  try {
    return String(payload)
  } catch {
    return '[binary]'
  }
}

let mqttLogSeq = 0

export function mqttMakeLogEntry(
  dir: MqttLogDir,
  meta?: Partial<MqttLogEntry>,
): MqttLogEntry {
  const m = meta || {}
  const id =
    typeof m.id === 'number' && Number.isFinite(m.id) && m.id > 0
      ? m.id
      : ++mqttLogSeq
  if (id > mqttLogSeq) mqttLogSeq = id
  return {
    id,
    dir: dir || 'system',
    time: new Date().toLocaleTimeString(),
    topic: m.topic || '',
    qos: m.qos,
    retain: !!m.retain,
    payload: m.payload !== undefined ? String(m.payload) : '',
    message: m.message || '',
    format: m.format,
  }
}

export function mqttTrimLogs(logs: MqttLogEntry[], max = MQTT_LOG_MAX): MqttLogEntry[] {
  if (logs.length <= max) return logs
  return logs.slice(logs.length - max)
}

/** 原地追加并截断，避免高频消息时整表拷贝 */
export function mqttPushLog(
  logs: MqttLogEntry[],
  entry: MqttLogEntry,
  max = MQTT_LOG_MAX,
): void {
  logs.push(entry)
  if (logs.length > max) {
    logs.splice(0, logs.length - max)
  }
}

export function mqttExportStamp(d?: Date): string {
  const dt = d instanceof Date ? d : new Date()
  const pad = (n: number) => (n < 10 ? '0' + n : String(n))
  return (
    dt.getFullYear() +
    pad(dt.getMonth() + 1) +
    pad(dt.getDate()) +
    '-' +
    pad(dt.getHours()) +
    pad(dt.getMinutes()) +
    pad(dt.getSeconds())
  )
}

export function mqttStatusLabel(kind: MqttStatusKind): string {
  if (kind === 'connected') return '已连接'
  if (kind === 'connecting') return '连接中…'
  if (kind === 'error') return '错误'
  if (kind === 'offline') return '离线'
  return '未连接'
}

export function mqttColorForTopic(topic: string, subs: MqttSubItem[]): string {
  if (!topic || !subs.length) return ''
  for (const s of subs) {
    if (s.topic === topic) return s.color || ''
  }
  for (const s of subs) {
    if (mqttTopicMatchesFilter(topic, s.topic)) return s.color || ''
  }
  return ''
}

export function mqttCreateEmptyStats(): MqttStats {
  return { connectedAt: null, recv: 0, sent: 0, recvBytes: 0, sentBytes: 0 }
}
