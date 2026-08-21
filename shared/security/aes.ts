import { bytesToBase64, bytesToHex, encodeUtf8, isSubtleAvailable, randomBytes } from './crypto-bytes'

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.replace(/\s/g, ''))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function importAesKey(pass: string, usages: KeyUsage[]) {
  const raw = encodeUtf8(pass.padEnd(32, '0').slice(0, 32))
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, usages)
}

export async function aesEncrypt(plain: string, password: string): Promise<string> {
  if (!isSubtleAvailable()) throw new Error('需要 Web Crypto')
  const iv = randomBytes(12)
  const key = await importAesKey(password, ['encrypt'])
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodeUtf8(plain))
  return JSON.stringify({ alg: 'AES-GCM', iv: bytesToBase64(iv), ct: bytesToBase64(new Uint8Array(ct)), note: '口令经 pad/slice 至 32 字节，演示用' })
}

export async function aesDecrypt(payload: string, password: string): Promise<string> {
  if (!isSubtleAvailable()) throw new Error('需要 Web Crypto')
  const obj = JSON.parse(payload)
  const key = await importAesKey(password, ['decrypt'])
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(obj.iv) }, key, b64ToBytes(obj.ct))
  return new TextDecoder().decode(pt)
}

export async function aesKeyHex(password: string): Promise<string> {
  return bytesToHex(encodeUtf8(password.padEnd(32, '0').slice(0, 32)))
}
