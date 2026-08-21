/** STOMP 帧编解码（对照旧站 stomp.js，手写协议、无第三方库） */

export const STOMP_NULL = '\x00'
export const STOMP_LF = '\n'
export const STOMP_HEARTBEAT = '\n'

export type StompFrame = {
  command: string
  headers: Record<string, string>
  body: string
}

export type StompLogEntry = {
  id: number
  time: string
  dir: 'in' | 'out' | 'system'
  command?: string
  headers?: Record<string, string>
  body?: string
  text?: string
}

export function stompEncode(
  command: string,
  headers?: Record<string, string>,
  body?: string,
): string {
  let frame = command + STOMP_LF
  const h = headers || {}
  Object.keys(h).forEach((k) => {
    const v = h[k]
    if (v !== undefined && v !== null && v !== '') {
      frame += k + ':' + v + STOMP_LF
    }
  })
  frame += STOMP_LF
  if (body) frame += body
  frame += STOMP_NULL
  return frame
}

export function stompParseLine(line: string, headers: Record<string, string>) {
  if (!line) return
  const idx = line.indexOf(':')
  if (idx <= 0) return
  headers[line.substring(0, idx)] = line.substring(idx + 1)
}

export function stompParseFrame(raw: string): StompFrame {
  const sep = raw.indexOf(STOMP_LF + STOMP_LF)
  let command: string
  let headerBlock: string
  let body: string
  if (sep === -1) {
    const nl = raw.indexOf(STOMP_LF)
    command = nl === -1 ? raw : raw.substring(0, nl)
    headerBlock = nl === -1 ? '' : raw.substring(nl + 1)
    body = ''
  } else {
    const nl = raw.indexOf(STOMP_LF)
    command = raw.substring(0, nl)
    headerBlock = raw.substring(nl + 1, sep)
    body = raw.substring(sep + 2)
  }
  const headers: Record<string, string> = {}
  if (headerBlock) {
    headerBlock.split(STOMP_LF).forEach((line) => stompParseLine(line, headers))
  }
  return { command, headers, body }
}

export function stompParseExtraHeaders(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  if (!text) return result
  text.split(/\r?\n/).forEach((line) => {
    const idx = line.indexOf(':')
    if (idx > 0) {
      result[line.substring(0, idx).trim()] = line.substring(idx + 1).trim()
    }
  })
  return result
}

/** 从缓冲区分帧，返回 [frames, remainingBuffer] */
export function stompSplitBuffer(buffer: string): { frames: StompFrame[]; rest: string } {
  const frames: StompFrame[] = []
  let rest = buffer
  let idx: number
  while ((idx = rest.indexOf(STOMP_NULL)) !== -1) {
    const raw = rest.substring(0, idx)
    rest = rest.substring(idx + 1)
    if (!raw) continue
    frames.push(stompParseFrame(raw))
  }
  return { frames, rest }
}

export function stompPrettyBody(body: string, contentType: string): string {
  if (!body) return ''
  if ((contentType || '').toLowerCase().includes('json')) {
    try {
      return JSON.stringify(JSON.parse(body), null, 2)
    } catch {
      return body
    }
  }
  return body
}

export function stompStatusLabel(
  s: 'idle' | 'connecting' | 'ws-open' | 'connected' | 'closed',
): string {
  if (s === 'connected') return 'STOMP 已连接'
  if (s === 'ws-open') return 'WS 已连接 / STOMP 协商中'
  if (s === 'connecting') return '连接中...'
  if (s === 'closed') return '已断开'
  return '未连接'
}
