/** JWT 生成 / 校验（仅 HS256，Web Crypto） */

import { bytesToBase64, encodeUtf8, isSubtleAvailable } from './crypto-bytes'

function b64url(data: ArrayBuffer | Uint8Array | string): string {
  let b64: string
  if (typeof data === 'string') {
    b64 = btoa(unescape(encodeURIComponent(data)))
  } else {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
    b64 = bytesToBase64(bytes)
  }
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export async function jwtSignHs256(payload: Record<string, unknown>, secret: string, extraHeader?: Record<string, unknown>): Promise<string> {
  if (!isSubtleAvailable()) throw new Error('需要 Web Crypto')
  const header = { alg: 'HS256', typ: 'JWT', ...(extraHeader || {}) }
  const h = b64url(JSON.stringify(header))
  const p = b64url(JSON.stringify(payload))
  const data = `${h}.${p}`
  const key = await crypto.subtle.importKey(
    'raw',
    encodeUtf8(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encodeUtf8(data))
  return `${data}.${b64url(sig)}`
}

export async function jwtVerifyHs256(token: string, secret: string): Promise<string> {
  if (!isSubtleAvailable()) throw new Error('需要 Web Crypto')
  const parts = String(token || '').trim().split('.')
  if (parts.length !== 3) throw new Error('JWT 应为 header.payload.signature')
  const [h, p, s] = parts
  const data = `${h}.${p}`
  const key = await crypto.subtle.importKey(
    'raw',
    encodeUtf8(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const ok = await crypto.subtle.verify('HMAC', key, b64urlToBytes(s!), encodeUtf8(data))
  let header: unknown
  let payload: unknown
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h!)))
    payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p!)))
  } catch {
    throw new Error('header/payload 不是合法 JSON')
  }
  const now = Math.floor(Date.now() / 1000)
  const claims = payload as Record<string, unknown>
  const warnings: string[] = []
  if (typeof claims.exp === 'number' && now > claims.exp) warnings.push('已过期 (exp)')
  if (typeof claims.nbf === 'number' && now < claims.nbf) warnings.push('尚未生效 (nbf)')
  return [
    `签名校验: ${ok ? '通过' : '失败'}`,
    warnings.length ? `声明: ${warnings.join('; ')}` : '声明: exp/nbf 正常或未设置',
    '',
    '=== header ===',
    JSON.stringify(header, null, 2),
    '',
    '=== payload ===',
    JSON.stringify(payload, null, 2),
  ].join('\n')
}
