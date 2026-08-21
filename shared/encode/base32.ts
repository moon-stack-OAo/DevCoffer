/** Base32 (RFC 4648) / Base58 (Bitcoin) */

const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const B32_LOOKUP: Record<string, number> = Object.create(null)
for (let i = 0; i < B32_ALPHABET.length; i++) {
  B32_LOOKUP[B32_ALPHABET[i]!] = i
  B32_LOOKUP[B32_ALPHABET[i]!.toLowerCase()] = i
}

const B58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const B58_LOOKUP: Record<string, number> = Object.create(null)
for (let i = 0; i < B58_ALPHABET.length; i++) {
  B58_LOOKUP[B58_ALPHABET[i]!] = i
}

function encodeUtf8(text: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text)
  const buf = Buffer.from(text, 'utf8')
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
}

function decodeUtf8(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(bytes)
  return Buffer.from(bytes).toString('utf8')
}

export function textToBytes(text: string): Uint8Array {
  return encodeUtf8(String(text || ''))
}

export function bytesToText(bytes: Uint8Array): string {
  return decodeUtf8(bytes)
}

export function parseHex(hex: string): Uint8Array {
  const cleaned = String(hex || '')
    .replace(/0x/gi, '')
    .replace(/[\s,;:_-]/g, '')
  if (!cleaned) throw new Error('Hex 为空')
  if (!/^[0-9a-fA-F]+$/.test(cleaned) || cleaned.length % 2 !== 0) {
    throw new Error('非法 Hex（需偶数位）')
  }
  const pairs = cleaned.match(/.{1,2}/g) || []
  return new Uint8Array(pairs.map((h) => parseInt(h, 16)))
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function base32Encode(bytes: Uint8Array, options?: { padding?: boolean }): string {
  const padding = options?.padding !== false
  if (!bytes || !bytes.length) return ''
  let bits = 0
  let value = 0
  let output = ''
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i]!
    bits += 8
    while (bits >= 5) {
      output += B32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += B32_ALPHABET[(value << (5 - bits)) & 31]
  if (padding) while (output.length % 8 !== 0) output += '='
  return output
}

export function base32Decode(str: string): Uint8Array {
  const cleaned = String(str || '')
    .replace(/\s+/g, '')
    .replace(/=+$/, '')
  if (!cleaned) return new Uint8Array(0)
  let bits = 0
  let value = 0
  const out: number[] = []
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]!
    const idx = B32_LOOKUP[ch]
    if (idx === undefined) throw new Error('非法 Base32 字符: ' + ch)
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return new Uint8Array(out)
}

export function base58Encode(bytes: Uint8Array): string {
  if (!bytes || !bytes.length) return ''
  let zeros = 0
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++
  const size = Math.ceil(((bytes.length - zeros) * 138) / 100) + 1
  const b58 = new Uint8Array(size)
  let length = 0
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i]!
    let j = 0
    for (let k = size - 1; k >= 0; k--, j++) {
      if (carry === 0 && j >= length) break
      carry += 256 * b58[k]!
      b58[k] = carry % 58
      carry = (carry / 58) | 0
    }
    length = j
  }
  let start = size - length
  while (start < size && b58[start] === 0) start++
  let result = ''
  for (let i = 0; i < zeros; i++) result += '1'
  for (let i = start; i < size; i++) result += B58_ALPHABET[b58[i]!]
  return result
}

export function base58Decode(str: string): Uint8Array {
  const cleaned = String(str || '').replace(/\s+/g, '')
  if (!cleaned) return new Uint8Array(0)
  let zeros = 0
  while (zeros < cleaned.length && cleaned[zeros] === '1') zeros++
  const size = Math.ceil(((cleaned.length - zeros) * 733) / 1000) + 1
  const b256 = new Uint8Array(size)
  let length = 0
  for (let i = zeros; i < cleaned.length; i++) {
    const ch = cleaned[i]!
    const idx = B58_LOOKUP[ch]
    if (idx === undefined) throw new Error('非法 Base58 字符: ' + ch)
    let carry = idx
    let j = 0
    for (let k = size - 1; k >= 0; k--, j++) {
      if (carry === 0 && j >= length) break
      carry += 58 * b256[k]!
      b256[k] = carry % 256
      carry = (carry / 256) | 0
    }
    length = j
  }
  let start = size - length
  while (start < size && b256[start] === 0) start++
  const out = new Uint8Array(zeros + (size - start))
  for (let i = 0; i < zeros; i++) out[i] = 0
  let p = zeros
  for (let i = start; i < size; i++) out[p++] = b256[i]!
  return out
}

export function encodeBase32Text(text: string, opts?: { padding?: boolean }): string {
  return base32Encode(textToBytes(text), opts)
}

export function decodeBase32Text(str: string): string {
  return bytesToText(base32Decode(str))
}
