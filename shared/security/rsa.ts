import { bytesToBase64, encodeUtf8, isSubtleAvailable } from './crypto-bytes'

export async function rsaGenerate(modulusLength = 2048) {
  if (!isSubtleAvailable()) throw new Error('需要 Web Crypto')
  const pair = await crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt'])
  const spki = await crypto.subtle.exportKey('spki', pair.publicKey)
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', pair.privateKey)
  return {
    publicPem: toPem(spki, 'PUBLIC KEY'),
    privatePem: toPem(pkcs8, 'PRIVATE KEY'),
    publicKey: pair.publicKey,
    privateKey: pair.privateKey,
  }
}

function toPem(buf: ArrayBuffer, label: string) {
  const b64 = bytesToBase64(new Uint8Array(buf))
  const lines = b64.match(/.{1,64}/g)?.join('\n') || b64
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`
}

function pemToBuf(pem: string) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out.buffer
}

export async function rsaEncrypt(plain: string, publicPem: string) {
  if (!isSubtleAvailable()) throw new Error('需要 Web Crypto')
  const key = await crypto.subtle.importKey('spki', pemToBuf(publicPem), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt'])
  const ct = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, encodeUtf8(plain))
  return bytesToBase64(new Uint8Array(ct))
}

export async function rsaDecrypt(cipherB64: string, privatePem: string) {
  if (!isSubtleAvailable()) throw new Error('需要 Web Crypto')
  const key = await crypto.subtle.importKey('pkcs8', pemToBuf(privatePem), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt'])
  const bin = atob(cipherB64.replace(/\s/g, ''))
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const pt = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, bytes)
  return new TextDecoder().decode(pt)
}
