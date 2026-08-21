import { bytesToBase64, encodeUtf8, isSubtleAvailable, randomBytes } from './crypto-bytes'

/** 演示：口令派生 AES-GCM + Base64，非完整 Jasypt PBE 兼容 */
export async function jasyptEncryptDemo(plain: string, password: string) {
  if (!isSubtleAvailable()) throw new Error('需要 Web Crypto')
  const salt = randomBytes(16)
  const base = await crypto.subtle.importKey('raw', encodeUtf8(password), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 1000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt'])
  const iv = randomBytes(12)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodeUtf8(plain))
  const packed = new Uint8Array(salt.length + iv.length + ct.byteLength)
  packed.set(salt, 0); packed.set(iv, 16); packed.set(new Uint8Array(ct), 28)
  return 'ENC(' + bytesToBase64(packed) + ')'
}

export async function jasyptDecryptDemo(enc: string, password: string) {
  if (!isSubtleAvailable()) throw new Error('需要 Web Crypto')
  const m = enc.match(/^ENC\((.+)\)$/)
  if (!m) throw new Error('格式应为 ENC(...)')
  const bin = atob(m[1]!.replace(/\s/g, ''))
  const all = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) all[i] = bin.charCodeAt(i)
  const salt = all.slice(0, 16), iv = all.slice(16, 28), ct = all.slice(28)
  const base = await crypto.subtle.importKey('raw', encodeUtf8(password), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 1000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt'])
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  return new TextDecoder().decode(pt)
}
