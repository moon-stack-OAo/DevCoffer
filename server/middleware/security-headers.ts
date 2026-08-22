import { randomBytes } from 'node:crypto'
import { buildCspHeader } from '../utils/csp'

/**
 * 安全响应头 + HTTP→HTTPS。
 * CSP：生产用 nonce（在 render 钩子写入 script）；开发用 unsafe-inline。
 * CSP 头在 render:response 设置，避免 SWR 缓存 HTML 与中间件新 nonce 错配。
 */
export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  if (url.pathname === '/health') return

  const isProd = process.env.NODE_ENV === 'production'
  const proto = (
    getRequestHeader(event, 'x-forwarded-proto') ||
    getRequestHeader(event, 'x-forwarded-protocol') ||
    ''
  )
    .split(',')[0]
    ?.trim()
    .toLowerCase()
  const host =
    getRequestHeader(event, 'x-forwarded-host') ||
    getRequestHeader(event, 'host') ||
    ''

  if (isProd && proto === 'http' && host) {
    return sendRedirect(event, `https://${host}${url.pathname}${url.search}`, 301)
  }

  if (isProd) {
    event.context.cspNonce = randomBytes(16).toString('base64url')
  }

  setResponseHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '0',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  })

  const isHttps = proto === 'https' || (!proto && url.protocol === 'https:')
  if (isProd && isHttps) {
    setResponseHeader(
      event,
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    )
  }

  // 开发环境无 nonce，直接在此下发宽松 CSP；生产由 render:response 下发
  if (!isProd) {
    setResponseHeader(event, 'Content-Security-Policy', buildCspHeader())
  }
})
