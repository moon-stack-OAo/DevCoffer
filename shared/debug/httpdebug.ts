/** HTTP 调试 — 纯函数（对照旧站 httpdebug.js） */

export type KvPair = [string, string]

export type BodyType = 'none' | 'json' | 'form' | 'text' | 'raw'

export type AuthType = 'none' | 'bearer' | 'basic' | 'apikey'

export type CodeLang = 'curl' | 'fetch' | 'axios' | 'java'

export type CurlOpts = {
  follow?: boolean
  insecure?: boolean
  compressed?: boolean
  verbose?: boolean
  includeHeader?: boolean
  silent?: boolean
  timeout?: string | number
  ua?: string
}

export type AuthState = {
  type: AuthType
  token?: string
  user?: string
  password?: string
  apiName?: string
  apiVal?: string
  apiLoc?: 'header' | 'query'
}

export type RequestConfig = {
  method: string
  url: string
  headers: KvPair[]
  body: string
  bodyType: BodyType
  isBodyDisabled?: boolean
  hasContentType?: boolean
}

export type HistoryItem = {
  id: number
  method: string
  url: string
  headers: KvPair[]
  body: string
  bodyType: BodyType
  time: string
}

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const

export const HISTORY_KEY = 'httpdebug_history'
export const HISTORY_MAX = 50
export const HISTORY_BODY_MAX = 2048
export const PROXY_PATH = '/__cors_proxy'
export const PROXY_HEADER = 'dev-tools-cors-proxy'

const SENSITIVE_HEADERS = [
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'api-key',
  'x-auth-token',
  'x-access-token',
  'x-csrf-token',
  'x-xsrf-token',
]

const SENSITIVE_BODY_KEYS =
  /^(password|passwd|pwd|token|access_token|refresh_token|id_token|secret|client_secret|api_key|apikey|auth|authorization|private_key|session|session_id|sessionid)$/i

export function shellQuote(s: unknown): string {
  if (s === undefined || s === null) return "''"
  const str = String(s)
  if (str === '') return "''"
  if (!/[^A-Za-z0-9_\-./:=?&%@,+]/.test(str)) return str
  return "'" + str.replace(/'/g, "'\\''") + "'"
}

export function jsString(s: unknown): string {
  return (
    "'" +
    String(s == null ? '' : s)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n') +
    "'"
  )
}

export function javaString(s: unknown): string {
  return (
    '"' +
    String(s == null ? '' : s)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n') +
    '"'
  )
}

export function formatCurlOutput(cmd: string, fmt: 'multi' | 'single'): string {
  if (fmt === 'single') return cmd.replace(/ \\\n/g, ' ')
  return cmd
}

export function resolveCodeHeaders(cfg: RequestConfig): {
  headers: KvPair[]
  usesBody: boolean
  method: string
  body: string
} {
  const method = (cfg.method || 'GET').toUpperCase()
  const isBodyDisabled =
    cfg.isBodyDisabled != null ? cfg.isBodyDisabled : method === 'GET' || method === 'HEAD'
  const bodyType = cfg.bodyType || 'none'
  const body = cfg.body || ''
  const usesBody = !!(body && !isBodyDisabled && bodyType !== 'none')
  const headers: KvPair[] = (cfg.headers || []).map((h) => [h[0], h[1]])
  let hasContentType =
    cfg.hasContentType != null
      ? cfg.hasContentType
      : headers.some((h) => String(h[0] || '').toLowerCase() === 'content-type')
  if (usesBody && !hasContentType) {
    if (bodyType === 'json') {
      headers.push(['Content-Type', 'application/json'])
      hasContentType = true
    } else if (bodyType === 'form') {
      headers.push(['Content-Type', 'application/x-www-form-urlencoded'])
      hasContentType = true
    } else if (bodyType === 'text') {
      headers.push(['Content-Type', 'text/plain'])
      hasContentType = true
    }
  }
  return { headers, usesBody, method, body }
}

export function buildCurlFromConfig(cfg: RequestConfig, opts: CurlOpts = {}): string {
  const r = resolveCodeHeaders(cfg)
  if (!cfg.url) return ''
  const parts: string[] = []
  if (r.method === 'GET') parts.push('curl ' + shellQuote(cfg.url))
  else if (r.method === 'HEAD') parts.push('curl -X HEAD ' + shellQuote(cfg.url))
  else parts.push('curl -X ' + r.method + ' ' + shellQuote(cfg.url))
  r.headers.forEach((pair) => {
    parts.push('  -H ' + shellQuote(pair[0] + ': ' + pair[1]))
  })
  if (r.usesBody) parts.push('  --data-raw ' + shellQuote(r.body))
  if (opts.follow) parts.push('  -L')
  if (opts.insecure) parts.push('  -k')
  if (opts.compressed) parts.push('  --compressed')
  if (opts.verbose) parts.push('  -v')
  if (opts.includeHeader) parts.push('  -i')
  if (opts.silent) parts.push('  -s')
  if (opts.timeout != null && opts.timeout !== '' && Number(opts.timeout) > 0) {
    parts.push('  --max-time ' + opts.timeout)
  }
  if (opts.ua) parts.push('  -A ' + shellQuote(opts.ua))
  return parts.join(' \\\n')
}

export function buildFetchCode(cfg: RequestConfig): string {
  const r = resolveCodeHeaders(cfg)
  if (!cfg.url) return '// 请输入 URL'
  const lines: string[] = []
  lines.push('const response = await fetch(' + jsString(cfg.url) + ', {')
  lines.push('  method: ' + jsString(r.method) + ',')
  if (r.headers.length) {
    lines.push('  headers: {')
    r.headers.forEach((pair, i) => {
      const comma = i < r.headers.length - 1 ? ',' : ''
      lines.push('    ' + jsString(pair[0]) + ': ' + jsString(pair[1]) + comma)
    })
    lines.push('  }' + (r.usesBody ? ',' : ''))
  }
  if (r.usesBody) lines.push('  body: ' + jsString(r.body))
  lines.push('});')
  lines.push('')
  lines.push('const data = await response.json(); // 或 response.text()')
  lines.push('console.log(response.status, data);')
  return lines.join('\n')
}

export function buildAxiosCode(cfg: RequestConfig): string {
  const r = resolveCodeHeaders(cfg)
  if (!cfg.url) return '// 请输入 URL'
  const lines: string[] = []
  lines.push("import axios from 'axios';")
  lines.push('')
  lines.push('const { data, status } = await axios({')
  lines.push('  method: ' + jsString(r.method.toLowerCase()) + ',')
  lines.push('  url: ' + jsString(cfg.url) + ',')
  if (r.headers.length) {
    lines.push('  headers: {')
    r.headers.forEach((pair, i) => {
      const comma = i < r.headers.length - 1 ? ',' : ''
      lines.push('    ' + jsString(pair[0]) + ': ' + jsString(pair[1]) + comma)
    })
    lines.push('  }' + (r.usesBody ? ',' : ''))
  }
  if (r.usesBody) {
    const bt = (cfg.bodyType || '').toLowerCase()
    if (bt === 'json') {
      try {
        JSON.parse(r.body)
        lines.push('  data: ' + r.body)
      } catch {
        lines.push('  data: ' + jsString(r.body))
      }
    } else {
      lines.push('  data: ' + jsString(r.body))
    }
  }
  lines.push('});')
  lines.push('')
  lines.push('console.log(status, data);')
  return lines.join('\n')
}

export function buildJavaHttpClientCode(cfg: RequestConfig): string {
  const r = resolveCodeHeaders(cfg)
  if (!cfg.url) return '// 请输入 URL'
  const lines: string[] = []
  lines.push('import java.net.URI;')
  lines.push('import java.net.http.HttpClient;')
  lines.push('import java.net.http.HttpRequest;')
  lines.push('import java.net.http.HttpResponse;')
  lines.push('import java.time.Duration;')
  lines.push('')
  lines.push('HttpClient client = HttpClient.newBuilder()')
  lines.push('        .connectTimeout(Duration.ofSeconds(30))')
  lines.push('        .build();')
  lines.push('')
  lines.push('HttpRequest.Builder builder = HttpRequest.newBuilder()')
  lines.push('        .uri(URI.create(' + javaString(cfg.url) + '))')
  lines.push('        .timeout(Duration.ofSeconds(30));')
  r.headers.forEach((pair) => {
    lines.push('builder.header(' + javaString(pair[0]) + ', ' + javaString(pair[1]) + ');')
  })
  const bodyPublisher = r.usesBody
    ? 'HttpRequest.BodyPublishers.ofString(' + javaString(r.body) + ')'
    : 'HttpRequest.BodyPublishers.noBody()'
  if (r.method === 'GET' && !r.usesBody) lines.push('builder.GET();')
  else if (r.method === 'DELETE' && !r.usesBody) lines.push('builder.DELETE();')
  else lines.push('builder.method(' + javaString(r.method) + ', ' + bodyPublisher + ');')
  lines.push('')
  lines.push('HttpRequest request = builder.build();')
  lines.push(
    'HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());',
  )
  lines.push('System.out.println(response.statusCode());')
  lines.push('System.out.println(response.body());')
  return lines.join('\n')
}

export function buildCode(cfg: RequestConfig, lang: CodeLang, opts: CurlOpts = {}): string {
  const l = (lang || 'curl').toLowerCase() as CodeLang
  if (l === 'fetch') return buildFetchCode(cfg)
  if (l === 'axios') return buildAxiosCode(cfg)
  if (l === 'java') return buildJavaHttpClientCode(cfg)
  return buildCurlFromConfig(cfg, opts)
}

/** @deprecated 兼容旧 import */
export function buildCurl(opts: {
  method: string
  url: string
  headers: string
  body: string
}): string {
  const headers: KvPair[] = []
  for (const line of String(opts.headers || '').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || !t.includes(':')) continue
    const i = t.indexOf(':')
    headers.push([t.slice(0, i).trim(), t.slice(i + 1).trim()])
  }
  return buildCurlFromConfig(
    {
      method: opts.method,
      url: opts.url,
      headers,
      body: opts.body,
      bodyType: opts.body ? 'raw' : 'none',
    },
    {},
  )
}

/** @deprecated 兼容旧 import */
export function parseHeaders(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of String(text || '').split(/\r?\n/)) {
    const i = line.indexOf(':')
    if (i < 0) continue
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

export function tokenizeCurl(s: string): string[] {
  const tokens: string[] = []
  let i = 0
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i]!)) i++
    if (i >= s.length) break
    if (s[i] === "'") {
      let buf = ''
      i++
      while (i < s.length && s[i] !== "'") {
        if (s[i] === '\\' && i + 1 < s.length && (s[i + 1] === "'" || s[i + 1] === '\\')) {
          buf += s[i + 1]
          i += 2
        } else {
          buf += s[i]
          i++
        }
      }
      tokens.push(buf)
      if (i < s.length) i++
    } else if (s[i] === '"') {
      let buf = ''
      i++
      while (i < s.length && s[i] !== '"') {
        if (s[i] === '\\' && i + 1 < s.length) {
          buf += s[i + 1]
          i += 2
        } else {
          buf += s[i]
          i++
        }
      }
      tokens.push(buf)
      if (i < s.length) i++
    } else {
      let j = i
      while (j < s.length && !/\s/.test(s[j]!) && s[j] !== "'" && s[j] !== '"') j++
      tokens.push(s.slice(i, j))
      i = j
    }
  }
  return tokens
}

export type ParseCurlResult =
  | {
      ok: true
      method: string
      url: string
      headers: KvPair[]
      queries: KvPair[]
      body: string
      bodyType: BodyType
      auth: AuthState
      opts: CurlOpts
    }
  | { ok: false; error: string }

export function parseCurl(text: string): ParseCurlResult {
  if (text == null || !String(text).trim()) return { ok: false, error: '请粘贴 curl 命令' }
  const raw = String(text).trim()
  if (!/^curl(\s|$)/i.test(raw)) return { ok: false, error: '请输入以 curl 开头的命令' }
  let s = raw.replace(/^curl\s+/i, '')
  s = s.replace(/\\\r?\n/g, ' ').replace(/\s+/g, ' ').trim()

  let method = 'GET'
  const xMatch = s.match(/(?:-X|--request)\s+('([^']*)'|"([^"]*)"|(\S+))/)
  if (xMatch) {
    method = (xMatch[2] || xMatch[3] || xMatch[4] || 'GET').toUpperCase()
    s = s.replace(/(?:-X|--request)\s+('([^']*)'|"([^"]*)"|(\S+))/, '')
  }

  const tokens = tokenizeCurl(s)
  const headers: KvPair[] = []
  const queries: KvPair[] = []
  let bodyVal = ''
  let hasBodyFlag = false
  let bodyType: BodyType = 'none'
  let url = ''
  let useGetFlag = false
  const auth: AuthState = { type: 'none' }
  const opts: CurlOpts = {
    follow: false,
    insecure: false,
    compressed: false,
    verbose: false,
    includeHeader: false,
    silent: false,
    timeout: '',
    ua: '',
  }

  let i = 0
  while (i < tokens.length) {
    const t = tokens[i]!
    if (t === '-H' || t === '--header') {
      const v = tokens[++i] || ''
      const idx = v.indexOf(':')
      if (idx > 0) {
        const k = v.slice(0, idx).trim()
        const val = v.slice(idx + 1).trim()
        if (k.toLowerCase() === 'authorization') {
          if (/^Bearer\s+/i.test(val)) {
            auth.type = 'bearer'
            auth.token = val.replace(/^Bearer\s+/i, '')
          } else if (/^Basic\s+/i.test(val)) {
            auth.type = 'basic'
            try {
              const decoded = decodeURIComponent(escape(atob(val.replace(/^Basic\s+/i, ''))))
              const idx2 = decoded.indexOf(':')
              auth.user = idx2 >= 0 ? decoded.slice(0, idx2) : decoded
              auth.password = idx2 >= 0 ? decoded.slice(idx2 + 1) : ''
            } catch {
              headers.push([k, val])
            }
          } else {
            headers.push([k, val])
          }
        } else {
          headers.push([k, val])
        }
      }
      i++
    } else if (t === '-G' || t === '--get') {
      useGetFlag = true
      i++
    } else if (
      t === '-d' ||
      t === '--data' ||
      t === '--data-raw' ||
      t === '--data-binary' ||
      t === '--data-urlencode'
    ) {
      let v = tokens[++i] || ''
      if (t === '--data-urlencode') {
        try {
          v = decodeURIComponent(v)
        } catch {
          /* keep */
        }
      }
      if (useGetFlag) {
        v.split('&').forEach((seg) => {
          const eq = seg.indexOf('=')
          if (eq > 0) queries.push([seg.slice(0, eq), seg.slice(eq + 1)])
          else if (seg) queries.push([seg, ''])
        })
      } else {
        bodyVal += (bodyVal ? '&' : '') + v
        hasBodyFlag = true
        bodyType = t === '--data-urlencode' ? 'form' : 'raw'
      }
      i++
    } else if (t === '-L' || t === '--location') {
      opts.follow = true
      i++
    } else if (t === '-k' || t === '--insecure') {
      opts.insecure = true
      i++
    } else if (t === '--compressed') {
      opts.compressed = true
      i++
    } else if (t === '-v' || t === '--verbose') {
      opts.verbose = true
      i++
    } else if (t === '-i' || t === '--include') {
      opts.includeHeader = true
      i++
    } else if (t === '-s' || t === '--silent') {
      opts.silent = true
      i++
    } else if (t === '--max-time' || t === '--connect-timeout') {
      opts.timeout = tokens[++i] || ''
      i++
    } else if (t.startsWith('--max-time=') || t.startsWith('--connect-timeout=')) {
      opts.timeout = t.split('=')[1] || ''
      i++
    } else if (t === '-A' || t === '--user-agent') {
      opts.ua = tokens[++i] || ''
      i++
    } else if (t.startsWith('-A=')) {
      opts.ua = t.slice(3)
      i++
    } else if (t === '--url') {
      url = tokens[++i] || url
      i++
    } else if (t.startsWith('--url=')) {
      url = t.slice('--url='.length)
      i++
    } else if (t.startsWith('-')) {
      if (t.includes('=')) i++
      else if (tokens[i + 1] && !tokens[i + 1]!.startsWith('-')) i += 2
      else i++
    } else {
      if (!url) url = t
      i++
    }
  }

  if (url) {
    try {
      const u = new URL(url)
      u.searchParams.forEach((v, k) => {
        queries.push([k, v])
      })
      url = u.origin + u.pathname
    } catch {
      /* keep */
    }
  }

  let finalBodyType: BodyType = 'none'
  let finalBody = ''
  if (hasBodyFlag) {
    finalBody = bodyVal
    if (bodyType === 'form' && bodyVal.includes('=')) {
      finalBodyType = 'form'
    } else if (bodyType === 'raw') {
      const trimmed = bodyVal.trim()
      let isJson = false
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          JSON.parse(trimmed)
          isJson = true
        } catch {
          isJson = false
        }
      }
      finalBodyType = isJson ? 'json' : 'raw'
    } else {
      finalBodyType = bodyType === 'form' ? 'form' : 'raw'
    }
  }

  if (hasBodyFlag && method === 'GET' && !useGetFlag) method = 'POST'

  return {
    ok: true,
    method,
    url,
    headers,
    queries,
    body: finalBody,
    bodyType: finalBodyType,
    auth,
    opts,
  }
}

export function collectAuthHeaders(auth: AuthState): KvPair[] {
  if (!auth || auth.type === 'none') return []
  const out: KvPair[] = []
  if (auth.type === 'bearer') {
    const token = auth.token || ''
    if (token) out.push(['Authorization', 'Bearer ' + token])
  } else if (auth.type === 'basic') {
    const user = auth.user || ''
    const pwd = auth.password || ''
    if (user || pwd) {
      try {
        out.push([
          'Authorization',
          'Basic ' + btoa(unescape(encodeURIComponent(user + ':' + pwd))),
        ])
      } catch {
        /* ignore */
      }
    }
  } else if (auth.type === 'apikey') {
    const name = auth.apiName || ''
    const val = auth.apiVal || ''
    const loc = auth.apiLoc || 'header'
    if (name && val) {
      if (loc === 'header') out.push([name, val])
      else out.push(['__apikey__', name + '=' + val])
    }
  }
  return out
}

export function buildRequestConfig(input: {
  method: string
  url: string
  headers: KvPair[]
  queries: KvPair[]
  body: string
  bodyType: BodyType
  auth: AuthState
}): RequestConfig {
  const method = (input.method || 'GET').toUpperCase()
  let url = (input.url || '').trim()
  let headers = (input.headers || []).slice()
  let query = (input.queries || []).slice()
  const bodyType = input.bodyType || 'none'
  const body = input.body || ''
  const isBodyDisabled = method === 'GET' || method === 'HEAD'

  const authHeaders = collectAuthHeaders(input.auth)
  const authApiKeyQuery = authHeaders
    .filter(([k]) => k === '__apikey__')
    .map(([, v]) => {
      const eq = v.indexOf('=')
      return (eq >= 0 ? [v.slice(0, eq), v.slice(eq + 1)] : [v, '']) as KvPair
    })
  const authOnlyHeaders = authHeaders.filter(([k]) => k !== '__apikey__')
  if (authApiKeyQuery.length) query = query.concat(authApiKeyQuery)

  let hasContentType = false
  headers.forEach(([k]) => {
    if (k.toLowerCase() === 'content-type') hasContentType = true
  })

  const mergedHeaders = headers.slice()
  authOnlyHeaders.forEach((ah) => {
    const idx = mergedHeaders.findIndex((h) => h[0].toLowerCase() === ah[0].toLowerCase())
    if (idx >= 0) mergedHeaders[idx] = ah
    else mergedHeaders.push(ah)
  })

  if (query.length) {
    try {
      const u = new URL(url)
      query.forEach(([k, v]) => {
        if (!u.searchParams.has(k)) u.searchParams.append(k, v)
      })
      url = u.toString()
    } catch {
      const sep = url.includes('?') ? '&' : '?'
      const qs = query
        .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
        .join('&')
      url += sep + qs
    }
  }

  return {
    method,
    url,
    headers: mergedHeaders,
    body,
    bodyType,
    isBodyDisabled,
    hasContentType,
  }
}

export function buildFetchOpts(cfg: RequestConfig, compressed?: boolean): RequestInit {
  const opts: RequestInit = { method: cfg.method }
  const headerObj: Record<string, string> = {}
  cfg.headers.forEach(([k, v]) => {
    headerObj[k] = v
  })
  const usesBody = !!(cfg.body && !cfg.isBodyDisabled && cfg.bodyType !== 'none')
  if (usesBody) {
    if (cfg.bodyType === 'json' && !cfg.hasContentType) headerObj['Content-Type'] = 'application/json'
    else if (cfg.bodyType === 'form' && !cfg.hasContentType)
      headerObj['Content-Type'] = 'application/x-www-form-urlencoded'
    else if (cfg.bodyType === 'text' && !cfg.hasContentType) headerObj['Content-Type'] = 'text/plain'
    opts.body = cfg.body
  }
  if (compressed) headerObj['Accept-Encoding'] = headerObj['Accept-Encoding'] || 'gzip, deflate'
  opts.headers = headerObj
  return opts
}

export function applyProxyUrl(url: string, useProxy: boolean): string {
  if (!useProxy) return url
  return PROXY_PATH + '?target=' + encodeURIComponent(url)
}

export function isTextType(contentType: string): boolean {
  if (!contentType) return true
  const ct = contentType.toLowerCase()
  return (
    ct.startsWith('text/') ||
    ct.includes('json') ||
    ct.includes('xml') ||
    ct.includes('javascript') ||
    ct.includes('x-www-form-urlencoded') ||
    ct.includes('html') ||
    ct.includes('plain')
  )
}

export function isPreviewable(contentType: string): boolean {
  if (!contentType) return false
  const ct = contentType.toLowerCase()
  return (
    ct.startsWith('image/') ||
    ct === 'application/pdf' ||
    ct.startsWith('video/') ||
    ct.startsWith('audio/')
  )
}

export function formatBytes(bytes: number): string {
  if (!isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export function extractFilename(
  disposition: string,
  url: string,
  contentType: string,
): string {
  const cd = disposition || ''
  const m = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(cd)
  if (m) {
    try {
      return decodeURIComponent(m[1]!.replace(/"/g, ''))
    } catch {
      return m[1]!.replace(/"/g, '')
    }
  }
  try {
    const u = new URL(url)
    const base = u.pathname.split('/').filter(Boolean).pop()
    if (base) return base
  } catch {
    /* ignore */
  }
  if (contentType.startsWith('image/')) return 'response.' + (contentType.split('/')[1] || 'bin')
  if (contentType === 'application/pdf') return 'response.pdf'
  if (contentType.includes('json')) return 'response.json'
  return 'response.bin'
}

export function isSensitiveHeaderName(name: string): boolean {
  if (name == null || name === '') return false
  return SENSITIVE_HEADERS.indexOf(String(name).trim().toLowerCase()) >= 0
}

export function sanitizeHeaders(headers: KvPair[]): KvPair[] {
  if (!headers || !Array.isArray(headers)) return []
  return headers.map((pair) => {
    if (!pair || !Array.isArray(pair)) return pair
    if (isSensitiveHeaderName(pair[0])) return [pair[0], '***']
    return [pair[0], pair[1]]
  })
}

function sanitizeJsonValue(val: unknown): unknown {
  if (val == null) return val
  if (Array.isArray(val)) return val.map(sanitizeJsonValue)
  if (typeof val === 'object') {
    const out: Record<string, unknown> = {}
    Object.keys(val as object).forEach((key) => {
      if (SENSITIVE_BODY_KEYS.test(key)) out[key] = '***'
      else out[key] = sanitizeJsonValue((val as Record<string, unknown>)[key])
    })
    return out
  }
  return val
}

export function sanitizeBody(body: string, bodyType: string): string {
  if (body == null || body === '') return body || ''
  let text = String(body)
  const type = (bodyType || '').toLowerCase()
  if (type === 'json' || (type !== 'form' && /^\s*[{\[]/.test(text))) {
    try {
      text = JSON.stringify(sanitizeJsonValue(JSON.parse(text)))
    } catch {
      /* ignore */
    }
  } else if (type === 'form' || (type !== 'json' && text.indexOf('=') >= 0 && text.indexOf('\n') < 0)) {
    text = text
      .split('&')
      .map((part) => {
        const eq = part.indexOf('=')
        if (eq < 0) return part
        const k = part.slice(0, eq)
        let keyDecoded = k
        try {
          keyDecoded = decodeURIComponent(k.replace(/\+/g, ' '))
        } catch {
          /* keep */
        }
        if (SENSITIVE_BODY_KEYS.test(keyDecoded)) return k + '=***'
        return part
      })
      .join('&')
  }
  if (text.length > HISTORY_BODY_MAX) {
    text = text.slice(0, HISTORY_BODY_MAX) + '\n/* ... truncated ... */'
  }
  return text
}

export function sanitizeHistoryItem(cfg: {
  method: string
  url: string
  headers: KvPair[]
  body: string
  bodyType: BodyType
}): Omit<HistoryItem, 'id' | 'time'> {
  return {
    method: cfg.method,
    url: cfg.url,
    headers: sanitizeHeaders(cfg.headers),
    body: sanitizeBody(cfg.body, cfg.bodyType),
    bodyType: cfg.bodyType,
  }
}

export function loadHistory(): HistoryItem[] {
  if (typeof localStorage === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveHistory(cfg: {
  method: string
  url: string
  headers: KvPair[]
  body: string
  bodyType: BodyType
}): HistoryItem[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const safe = sanitizeHistoryItem(cfg)
    const item: HistoryItem = {
      id: Date.now(),
      method: safe.method,
      url: safe.url,
      headers: safe.headers,
      body: safe.body,
      bodyType: safe.bodyType,
      time: new Date().toLocaleString(),
    }
    let list = loadHistory()
    list.unshift(item)
    if (list.length > HISTORY_MAX) list = list.slice(0, HISTORY_MAX)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
    return list
  } catch {
    return loadHistory()
  }
}

export function deleteHistory(id: number): HistoryItem[] {
  if (typeof localStorage === 'undefined') return []
  let list = loadHistory().filter((h) => h.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  return list
}

export function clearHistory(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(HISTORY_KEY)
}

export function formatJsonBody(text: string): { ok: true; text: string } | { ok: false; error: string } {
  try {
    return { ok: true, text: JSON.stringify(JSON.parse(text), null, 2) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'JSON 解析失败' }
  }
}

export function compressJsonBody(text: string): { ok: true; text: string } | { ok: false; error: string } {
  try {
    return { ok: true, text: JSON.stringify(JSON.parse(text)) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'JSON 解析失败' }
  }
}

export function buildErrorDiagnosis(
  err: Error & { name?: string },
  cfg: { url?: string; _usedProxy?: boolean },
): string {
  const msg = err.message || String(err)
  const causes: string[] = []
  const solutions: string[] = []
  if (err.name === 'ProxyUnavailableError' || /cors_proxy|本地 CORS 代理/i.test(msg)) {
    causes.push('当前部署未提供 /__cors_proxy（纯静态托管常见）')
    solutions.push('使用 Node/Docker 部署（内置代理），或关闭「通过本地代理」后直连（受 CORS 限制）')
  } else if (err.name === 'TimeoutError' || /timeout/i.test(msg)) {
    causes.push('请求超时')
    solutions.push('增大 Options 中的超时秒数，或检查目标服务是否可达')
  } else if (err.name === 'AbortError' || /aborted/i.test(msg)) {
    causes.push('请求已取消')
    solutions.push('重新发送即可')
  } else if (/Failed to fetch|NetworkError|CORS|cross-origin/i.test(msg)) {
    causes.push('浏览器 CORS 拦截或网络不可达')
    solutions.push('勾选 Options「通过本地代理」后重试（需同源 /__cors_proxy）')
    solutions.push('或确认目标接口允许跨域，且 URL/证书正确')
  } else {
    causes.push(msg)
    solutions.push('检查 URL、方法、Headers 与目标服务状态')
  }
  return [
    '请求失败',
    '',
    '原因：',
    ...causes.map((c) => '· ' + c),
    '',
    '建议：',
    ...solutions.map((s) => '· ' + s),
    cfg.url ? '\n目标: ' + cfg.url : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export const SAMPLE_REQUEST = {
  method: 'POST',
  url: 'https://jsonplaceholder.typicode.com/users',
  headers: [
    ['Content-Type', 'application/json'],
    ['Accept', 'application/json'],
  ] as KvPair[],
  queries: [
    ['page', '1'],
    ['size', '20'],
  ] as KvPair[],
  bodyType: 'json' as BodyType,
  body: JSON.stringify({ name: '张三', age: 25 }, null, 2),
}

export const BODY_TYPE_HINTS: Record<BodyType, string> = {
  none: '不发送请求体',
  json: 'json 格式将自动添加 Content-Type: application/json',
  form: 'form-urlencoded 格式（key=value&key2=value2），自动添加 Content-Type',
  text: '纯文本格式，自动添加 Content-Type: text/plain',
  raw: '原始正文，不会自动添加 Content-Type',
}
