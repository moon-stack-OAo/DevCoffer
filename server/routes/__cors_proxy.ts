/**
 * 同源 CORS 代理（对齐旧站 /__cors_proxy）
 * 端点：任意方法 /__cors_proxy?target=<encodeURIComponent(url)>
 * 探测：无 target 时返回 200 + x-proxied-by: dev-tools-cors-proxy
 */
import { getQuery, getMethod, readRawBody, setResponseHeader, setResponseStatus, send, createError } from 'h3'

const TIMEOUT_MS = 60_000
const PROXY_BY = 'dev-tools-cors-proxy'

const ALLOWED_METHODS = new Set([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
])

const HOP_BY_HOP = new Set([
  'host',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'origin',
  'referer',
  'content-length',
  'content-encoding',
])

function isBlockedTargetHost(hostname: string): boolean {
  const h = String(hostname || '')
    .replace(/^\[|\]$/g, '')
    .toLowerCase()
  if (
    h === 'metadata' ||
    h === 'metadata.google.internal' ||
    h === 'instance-data' ||
    h.endsWith('.metadata.google.internal')
  ) {
    return true
  }
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (m) {
    const p = m.slice(1, 5).map(Number)
    if (p.some((n) => n > 255)) return true
    if (p[0] === 169 && p[1] === 254) return true
    if (p[0] === 0 && p[1] === 0 && p[2] === 0 && p[3] === 0) return true
    return false
  }
  if (/^fe[89ab]/i.test(h)) return true
  if (h === 'fd00:ec2::254' || h.startsWith('fd00:ec2::254')) return true
  return false
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event).toUpperCase()
  setResponseHeader(event, 'x-proxied-by', PROXY_BY)
  setResponseHeader(event, 'cache-control', 'no-store')

  if (!ALLOWED_METHODS.has(method)) {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed: ' + method })
  }

  const query = getQuery(event)
  const target = typeof query.target === 'string' ? query.target : ''

  // 无 target：探测端点（前端 httpProbeCorsProxy 依赖）
  if (!target) {
    setResponseStatus(event, 200)
    setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
    return 'ok'
  }

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid target URL: ' + target })
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw createError({ statusCode: 400, statusMessage: 'Only http/https protocol supported' })
  }
  if (isBlockedTargetHost(parsed.hostname)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Target host is blocked (metadata/link-local): ' + parsed.hostname,
    })
  }

  const fwdHeaders: Record<string, string> = {}
  const reqHeaders = event.node.req.headers
  for (const [k, v] of Object.entries(reqHeaders)) {
    if (!v) continue
    if (HOP_BY_HOP.has(k.toLowerCase())) continue
    fwdHeaders[k] = Array.isArray(v) ? v.join(', ') : v
  }
  fwdHeaders.host = parsed.host

  const body =
    method === 'GET' || method === 'HEAD' ? undefined : await readRawBody(event, false)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const upstream = await fetch(parsed.toString(), {
      method,
      headers: fwdHeaders,
      body: body as BodyInit | undefined,
      signal: controller.signal,
      redirect: 'manual',
    })

    setResponseStatus(event, upstream.status)
    setResponseHeader(event, 'x-proxied-by', PROXY_BY)
    setResponseHeader(
      event,
      'access-control-expose-headers',
      'Content-Disposition, Content-Type, Content-Length, Content-Range, X-Proxied-By',
    )
    setResponseHeader(event, 'cache-control', 'no-store')

    upstream.headers.forEach((val, key) => {
      const lk = key.toLowerCase()
      if (['connection', 'keep-alive', 'transfer-encoding'].includes(lk)) return
      setResponseHeader(event, key, val)
    })

    const buf = Buffer.from(await upstream.arrayBuffer())
    return send(event, buf)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw createError({ statusCode: 502, statusMessage: 'Proxy error: ' + msg })
  } finally {
    clearTimeout(timer)
  }
})
