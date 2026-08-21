import { bytesToHex, encodeUtf8, isSubtleAvailable, randomBytes, bytesToBase64 } from './crypto-bytes'

export async function pbkdf2Derive(password: string, saltB64: string, iterations: number, length: number, hash: 'SHA-256' | 'SHA-512' = 'SHA-256') {
  if (!isSubtleAvailable()) throw new Error('需要 Web Crypto')
  const salt = saltB64 ? Uint8Array.from(atob(saltB64), c => c.charCodeAt(0)) : randomBytes(16)
  const base = await crypto.subtle.importKey('raw', encodeUtf8(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash }, base, length * 8)
  return { hex: bytesToHex(bits), salt: bytesToBase64(salt), iterations, length, hash }
}
