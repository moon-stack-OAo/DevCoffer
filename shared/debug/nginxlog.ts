/** Nginx combined / 主格式日志行解析与汇总 */

export type NginxLogEntry = {
  ip: string
  user: string
  time: string
  request: string
  method: string
  path: string
  urlPath: string
  query: string
  protocol: string
  status: number
  bytes: number
  referer: string
  userAgent: string
  raw: string
}

export function parseNginxLogLine(line: string): NginxLogEntry | null {
  if (line == null) return null
  const raw = String(line).trim()
  if (!raw) return null
  const re =
    /^(\S+)\s+\S+\s+(\S+)\s+\[([^\]]+)\]\s+"([^"]*)"\s+(\d{3})\s+(\S+)(?:\s+"([^"]*)"\s+"([^"]*)")?(?:\s+"([^"]*)")?/
  let m = raw.match(re)
  if (!m) {
    const loose = /^(\S+)\s+\S+\s+(\S+)\s+\[([^\]]+)\]\s+"([^"]*)"\s+(\d{3})\s+(\S+)/
    m = raw.match(loose)
    if (!m) return null
  }
  const request = m[4] || ''
  const reqParts = request.match(/^(\S+)\s+(\S+)(?:\s+(\S+))?/)
  const method = reqParts ? reqParts[1]! : ''
  const path = reqParts ? reqParts[2]! : request
  const protocol = reqParts && reqParts[3] ? reqParts[3] : ''
  const bytesRaw = m[6]!
  const bytes = bytesRaw === '-' ? 0 : parseInt(bytesRaw, 10)
  const status = parseInt(m[5]!, 10)
  let urlPath = path
  let query = ''
  const qIdx = path.indexOf('?')
  if (qIdx >= 0) {
    urlPath = path.slice(0, qIdx)
    query = path.slice(qIdx + 1)
  }
  return {
    ip: m[1]!,
    user: m[2] === '-' ? '' : m[2]!,
    time: m[3]!,
    request,
    method,
    path,
    urlPath,
    query,
    protocol,
    status,
    bytes: isNaN(bytes) ? 0 : bytes,
    referer: m[7] === '-' ? '' : m[7] || '',
    userAgent: m[8] || '',
    raw,
  }
}

export function parseNginxLog(
  text: string,
  options: {
    statusMin?: number | null
    statusMax?: number | null
    method?: string
    ip?: string
    pathContains?: string
    limit?: number | null
  } = {},
): { entries: NginxLogEntry[]; skipped: number; totalLines: number } {
  const lines = String(text == null ? '' : text).split(/\r?\n/)
  const entries: NginxLogEntry[] = []
  let skipped = 0
  const methodFilter = (options.method || '').toUpperCase()
  const ipFilter = (options.ip || '').trim()
  const pathFilter = (options.pathContains || '').trim()
  const statusMin = options.statusMin != null ? Number(options.statusMin) : null
  const statusMax = options.statusMax != null ? Number(options.statusMax) : null
  const limit = options.limit != null ? Number(options.limit) : null

  for (const line of lines) {
    if (!line.trim()) continue
    const e = parseNginxLogLine(line)
    if (!e) {
      skipped++
      continue
    }
    if (methodFilter && e.method.toUpperCase() !== methodFilter) continue
    if (ipFilter && e.ip.indexOf(ipFilter) < 0) continue
    if (pathFilter && e.path.indexOf(pathFilter) < 0) continue
    if (statusMin != null && !isNaN(statusMin) && e.status < statusMin) continue
    if (statusMax != null && !isNaN(statusMax) && e.status > statusMax) continue
    entries.push(e)
    if (limit != null && !isNaN(limit) && entries.length >= limit) break
  }
  return {
    entries,
    skipped,
    totalLines: lines.filter((l) => l.trim()).length,
  }
}

function topMap(map: Record<string, number>, n: number) {
  return Object.keys(map)
    .map((k) => ({ key: k, count: map[k]! }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

export function summarizeNginxLog(
  entriesOrResult: NginxLogEntry[] | { entries: NginxLogEntry[] },
  options: { topN?: number } = {},
) {
  const topN = options.topN != null ? options.topN : 10
  const entries = Array.isArray(entriesOrResult)
    ? entriesOrResult
    : entriesOrResult?.entries || []
  const statusCount: Record<string, number> = Object.create(null)
  const ipCount: Record<string, number> = Object.create(null)
  const urlCount: Record<string, number> = Object.create(null)
  const methodCount: Record<string, number> = Object.create(null)
  let totalBytes = 0
  for (const e of entries) {
    const st = String(e.status)
    statusCount[st] = (statusCount[st] || 0) + 1
    ipCount[e.ip] = (ipCount[e.ip] || 0) + 1
    const u = e.urlPath || e.path
    urlCount[u] = (urlCount[u] || 0) + 1
    methodCount[e.method || '-'] = (methodCount[e.method || '-'] || 0) + 1
    totalBytes += e.bytes || 0
  }
  return {
    total: entries.length,
    totalBytes,
    statusCount,
    statusGroups: {
      '2xx': entries.filter((e) => e.status >= 200 && e.status < 300).length,
      '3xx': entries.filter((e) => e.status >= 300 && e.status < 400).length,
      '4xx': entries.filter((e) => e.status >= 400 && e.status < 500).length,
      '5xx': entries.filter((e) => e.status >= 500 && e.status < 600).length,
    },
    topIps: topMap(ipCount, topN),
    topUrls: topMap(urlCount, topN),
    topMethods: topMap(methodCount, topN),
    methodCount,
  }
}

function formatEntry(e: NginxLogEntry): string {
  return [
    '=== Nginx combined ===',
    `remote_addr: ${e.ip}`,
    `remote_user: ${e.user || '-'}`,
    `time_local: ${e.time}`,
    `request: ${e.request}`,
    `method: ${e.method}`,
    `uri: ${e.path}`,
    `protocol: ${e.protocol}`,
    `status: ${e.status}`,
    `body_bytes_sent: ${e.bytes}`,
    `http_referer: ${e.referer || '-'}`,
    `http_user_agent: ${e.userAgent || '-'}`,
  ].join('\n')
}

export type NginxLogFilter = {
  statusMin?: number | null
  statusMax?: number | null
  method?: string
  ip?: string
  pathContains?: string
  limit?: number | null
}

export function parseNginxLogMulti(text: string, options: NginxLogFilter = {}): string {
  const result = parseNginxLog(text, options)
  if (!result.totalLines) throw new Error('请输入日志')
  if (!result.entries.length) {
    return [
      `未能解析任何行（跳过 ${result.skipped} / 共 ${result.totalLines}，或已被过滤）`,
      '',
      '期望类似:',
      '1.2.3.4 - - [19/Aug/2026:10:00:00 +0800] "GET / HTTP/1.1" 200 123 "-" "Mozilla/5.0"',
    ].join('\n')
  }
  if (result.entries.length === 1) return formatEntry(result.entries[0]!)
  return result.entries.map((e, i) => `--- #${i + 1} ---\n${formatEntry(e)}`).join('\n\n')
}

export function summarizeNginxLogText(text: string, options: NginxLogFilter = {}): string {
  const result = parseNginxLog(text, options)
  const summary = summarizeNginxLog(result, { topN: 10 })
  const lines = [
    `解析成功: ${summary.total} / 总行 ${result.totalLines}（跳过 ${result.skipped}）`,
    `总字节: ${summary.totalBytes}`,
    `状态组: 2xx=${summary.statusGroups['2xx']} 3xx=${summary.statusGroups['3xx']} 4xx=${summary.statusGroups['4xx']} 5xx=${summary.statusGroups['5xx']}`,
    '',
    'Top IP:',
    ...summary.topIps.map((x) => `  ${x.key} = ${x.count}`),
    '',
    'Top URL:',
    ...summary.topUrls.map((x) => `  ${x.key} = ${x.count}`),
    '',
    'Method:',
    ...summary.topMethods.map((x) => `  ${x.key} = ${x.count}`),
  ]
  return lines.join('\n')
}
