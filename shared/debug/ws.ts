/** WebSocket 调试：日志格式、状态文案与连接辅助 */

export type WsLogKind = 'in' | 'out' | 'system'

export type WsConnState = 'closed' | 'connecting' | 'open' | 'closing'

export interface WsLogEntry {
  id: number
  kind: WsLogKind
  content: string
  time: string
}

export const WS_LOG_SOFT_LIMIT = 500
export const WS_LOG_TRIM_TO = 400
export const WS_BODY_PREVIEW = 400

export function wsNow(): string {
  return new Date().toLocaleTimeString()
}

export function wsPrefix(kind: WsLogKind): string {
  if (kind === 'in') return '◀'
  if (kind === 'out') return '▶'
  return '●'
}

export function wsFormatLine(kind: WsLogKind, content: string, time = wsNow()): string {
  return `[${time}] ${wsPrefix(kind)} ${content}`
}

export function wsStatusLabel(state: WsConnState, closeCode?: number | null): string {
  if (state === 'open') return '已连接'
  if (state === 'connecting') return '连接中…'
  if (state === 'closing') return '断开中…'
  if (closeCode != null && closeCode !== 0) return `已断开 (code:${closeCode})`
  return '未连接'
}

export function wsStatusPillClass(state: WsConnState): 'connected' | 'connecting' | 'error' | 'disconnected' {
  if (state === 'open') return 'connected'
  if (state === 'connecting' || state === 'closing') return 'connecting'
  if (state === 'closed') return 'disconnected'
  return 'disconnected'
}

export function wsMakeEntry(kind: WsLogKind, content: string, id = 0): WsLogEntry {
  return { id, kind, content, time: wsNow() }
}

export function wsEntriesToText(entries: WsLogEntry[]): string {
  return entries.map((e) => wsFormatLine(e.kind, e.content, e.time)).join('\n')
}

export function wsEntryToText(entry: WsLogEntry): string {
  return wsFormatLine(entry.kind, entry.content, entry.time)
}

/** 解析子协议：逗号/换行分隔，去空、去重（保序） */
export function wsParseProtocols(raw: string): string[] {
  if (!raw?.trim()) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of raw.split(/[\n,]+/)) {
    const p = part.trim()
    if (!p || seen.has(p)) continue
    seen.add(p)
    out.push(p)
  }
  return out
}

export function wsValidateUrl(raw: string): string | null {
  const u = raw.trim()
  if (!u) return '请输入 WebSocket URL'
  if (!/^wss?:\/\//i.test(u)) return 'URL 需以 ws:// 或 wss:// 开头'
  try {
    const probe = u.replace(/^ws/i, 'http')
    void new URL(probe)
  } catch {
    return 'WebSocket URL 格式无效'
  }
  return null
}

export function wsFilterEntries(
  entries: WsLogEntry[],
  dir: 'all' | WsLogKind,
  keyword: string,
): WsLogEntry[] {
  const kw = keyword.trim().toLowerCase()
  return entries.filter((e) => {
    if (dir !== 'all' && e.kind !== dir) return false
    if (!kw) return true
    return e.content.toLowerCase().includes(kw) || e.kind.includes(kw)
  })
}

export function wsTrimLogs<T>(logs: T[], softLimit = WS_LOG_SOFT_LIMIT, trimTo = WS_LOG_TRIM_TO): T[] {
  if (logs.length <= softLimit) return logs
  return logs.slice(-trimTo)
}

export function wsPreviewContent(content: string, expanded: boolean, limit = WS_BODY_PREVIEW): string {
  if (!content) return ''
  if (expanded || content.length <= limit) return content
  return content.slice(0, limit) + '…(' + content.length + ' chars)'
}

export function wsConnSummary(url: string, protocols: string[]): string {
  const u = url.trim() || '未配置连接'
  if (!protocols.length) return u
  return u + ' · protocols: ' + protocols.join(', ')
}

export interface WsStats {
  connectedAt: number | null
  stoppedAt?: number | null
  recv: number
  sent: number
  recvBytes: number
  sentBytes: number
}

export const WS_QUICK_TEMPLATES: { label: string; body: string }[] = [
  { label: 'hello', body: 'hello' },
  { label: 'ping', body: 'ping' },
  { label: 'JSON ping', body: '{"type":"ping","ts":0}' },
  { label: 'JSON echo', body: '{"action":"echo","payload":"hello"}' },
]

export function wsCreateEmptyStats(): WsStats {
  return { connectedAt: null, recv: 0, sent: 0, recvBytes: 0, sentBytes: 0 }
}

function wsFormatDuration(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return pad(h) + ':' + pad(m) + ':' + pad(s)
}

function wsFormatBytes(n: number): string {
  const num = Number(n) || 0
  if (!isFinite(num) || num < 0) return '0 B'
  if (num < 1024) return Math.round(num) + ' B'
  if (num < 1024 * 1024) return (num / 1024).toFixed(1) + ' KB'
  return (num / 1024 / 1024).toFixed(2) + ' MB'
}

export function wsStatsText(stats: WsStats | null | undefined, now?: number): string {
  const s = stats || ({} as WsStats)
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
    dur = wsFormatDuration(end - Number(s.connectedAt))
  }
  return '↑' + sent + ' ↓' + recv + ' · ' + wsFormatBytes(bytes) + ' · ' + dur
}

export function wsByteLength(text: string): number {
  if (!text) return 0
  try {
    return new TextEncoder().encode(text).length
  } catch {
    return text.length
  }
}
