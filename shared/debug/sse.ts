/** SSE 调试：流解析、过滤、日志格式 */

export type SseStatusKind = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface SseLogEntry {
  id: number
  type: string
  data: string
  eventId: string | null
  timestamp: string
}

export interface SseParseState {
  eventType: string
  eventId: string | null
  data: string
}

export function sseNow(): string {
  return new Date().toLocaleTimeString()
}

export function sseParseHeadersJson(raw: string): Record<string, string> {
  const s = String(raw || '').trim()
  if (!s) return {}
  const obj = JSON.parse(s) as unknown
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error('请求头须为 JSON 对象')
  }
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (k) out[k] = v == null ? '' : String(v)
  }
  return out
}

export function sseParseFilter(raw: string): string[] {
  return String(raw || '')
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean)
}

export function sseCreateParseState(): SseParseState {
  return { eventType: 'message', eventId: null, data: '' }
}

/** 处理一行 SSE；空行时若有 data 则返回完整事件并重置状态 */
export function sseFeedLine(
  state: SseParseState,
  line: string,
): { eventType: string; eventId: string | null; data: string } | null {
  if (line.startsWith('event:')) {
    state.eventType = line.slice(6).trim() || 'message'
    return null
  }
  if (line.startsWith('id:')) {
    state.eventId = line.slice(3).trim() || null
    return null
  }
  if (line.startsWith('data:')) {
    const chunk = line.slice(5).trimStart()
    state.data += (state.data ? '\n' : '') + chunk
    return null
  }
  if (line === '') {
    if (!state.data) {
      state.eventType = 'message'
      state.eventId = null
      return null
    }
    const ev = {
      eventType: state.eventType || 'message',
      eventId: state.eventId,
      data: state.data,
    }
    state.eventType = 'message'
    state.eventId = null
    state.data = ''
    return ev
  }
  return null
}

export function sseShouldEmit(eventType: string, filterTypes: string[]): boolean {
  if (!filterTypes.length) return true
  return filterTypes.includes(eventType)
}

export function sseMakeEntry(
  type: string,
  data: string,
  eventId: string | null = null,
  id = 0,
): SseLogEntry {
  return {
    id,
    type,
    data,
    eventId,
    timestamp: sseNow(),
  }
}

export function sseFormatDataDisplay(data: string): string {
  try {
    return JSON.stringify(JSON.parse(data), null, 2)
  } catch {
    return data
  }
}

export function sseEntriesToText(entries: SseLogEntry[]): string {
  return entries
    .map((e) => {
      let line = `[${e.timestamp}] ${e.type}`
      if (e.eventId) line += ` (ID: ${e.eventId})`
      line += `: ${e.data}`
      return line
    })
    .join('\n')
}

export function sseStatusLabel(kind: SseStatusKind): string {
  if (kind === 'connected') return '已连接'
  if (kind === 'connecting') return '连接中…'
  if (kind === 'error') return '错误'
  return '未连接'
}

export function sseStatusPillClass(
  kind: SseStatusKind,
): 'connected' | 'connecting' | 'error' | 'disconnected' {
  if (kind === 'connected') return 'connected'
  if (kind === 'connecting') return 'connecting'
  if (kind === 'error') return 'error'
  return 'disconnected'
}

export function sseConnSummary(url: string, filterTypes: string[]): string {
  const u = String(url || '').trim() || '未配置 URL'
  if (!filterTypes.length) return u
  return u + ' · 过滤: ' + filterTypes.join(', ')
}

export function sseEntryKind(type: string): 'system' | 'error' | 'message' | 'notification' | 'other' {
  if (type === 'system' || type === 'error' || type === 'message' || type === 'notification') return type
  return 'other'
}

export function sseFilterEntries(
  entries: SseLogEntry[],
  typeFilter: string,
  keyword: string,
): SseLogEntry[] {
  const kw = String(keyword || '').trim().toLowerCase()
  return entries.filter((e) => {
    if (typeFilter === 'system' && e.type !== 'system') return false
    if (typeFilter === 'error' && e.type !== 'error') return false
    if (typeFilter === 'event' && (e.type === 'system' || e.type === 'error')) return false
    if (typeFilter && typeFilter !== 'all' && typeFilter !== 'system' && typeFilter !== 'error' && typeFilter !== 'event') {
      if (e.type !== typeFilter) return false
    }
    if (!kw) return true
    const hay = `${e.type} ${e.eventId || ''} ${e.data}`.toLowerCase()
    return hay.includes(kw)
  })
}

export function sseEntryToText(entry: SseLogEntry): string {
  let line = `[${entry.timestamp}] ${entry.type}`
  if (entry.eventId) line += ` (ID: ${entry.eventId})`
  line += `: ${entry.data}`
  return line
}

export function sseValidateUrl(raw: string): string | null {
  const u = String(raw || '').trim()
  if (!u) return '请输入 SSE 端点 URL'
  try {
    const parsed = new URL(u)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'URL 须为 http:// 或 https://'
    }
  } catch {
    return 'URL 格式无效'
  }
  return null
}

export function sseTrimLogs(entries: SseLogEntry[], max = 500): SseLogEntry[] {
  if (entries.length <= max) return entries
  return entries.slice(entries.length - max)
}
