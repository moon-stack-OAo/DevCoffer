/** Webhook HMAC 签名生成 / 校验（复用 hmac） */

import { hmacSign, type HmacAlgo, type HmacFormat } from './hmac'

function algoPrefix(algo: HmacAlgo): string {
  if (algo === 'SHA256') return 'sha256='
  if (algo === 'SHA1') return 'sha1='
  if (algo === 'MD5') return 'md5='
  if (algo === 'SHA384') return 'sha384='
  if (algo === 'SHA512') return 'sha512='
  return ''
}

/** 生成签名：纯 hex + GitHub 风格 `sha256=hex` */
export async function generateWebhookSig(opts: {
  secret: string
  body: string
  algo?: HmacAlgo
  format?: HmacFormat
}): Promise<string> {
  const algo = opts.algo || 'SHA256'
  const format = opts.format || 'hex'
  const mac = await hmacSign(opts.secret, opts.body, algo, format)
  const prefixed = algoPrefix(algo) + mac
  return [
    `算法: HMAC-${algo}`,
    `hex: ${mac}`,
    `GitHub 风格: ${prefixed}`,
  ].join('\n')
}

export async function verifyWebhookSig(opts: {
  secret: string
  body: string
  signature: string
  algo?: HmacAlgo
  format?: HmacFormat
  prefix?: string
}): Promise<string> {
  const algo = opts.algo || 'SHA256'
  const format = opts.format || 'hex'
  const prefix = opts.prefix || ''
  const mac = await hmacSign(opts.secret, opts.body, algo, format)
  const expected = (prefix + mac).toLowerCase()
  let given = String(opts.signature || '').trim()
  // 常见 GitHub: sha256=hex
  const m = given.match(/^(sha256|sha1|md5|sha384|sha512)=(.+)$/i)
  if (m) given = m[2]!
  given = given.toLowerCase().replace(/^0x/, '')
  const ok = timingSafeEqual(expected.replace(/^sha256=/, ''), (prefix + given).replace(/^sha256=/, '').toLowerCase()) ||
    timingSafeEqual(mac.toLowerCase(), given.toLowerCase())
  return [
    `算法: HMAC-${algo}`,
    `本地签名: ${prefix}${mac}`,
    `GitHub 风格: ${algoPrefix(algo)}${mac}`,
    `传入签名: ${opts.signature}`,
    `结果: ${ok ? '匹配 ✓' : '不匹配 ✗'}`,
  ].join('\n')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}
