import { encodeUtf8 } from './crypto-bytes'
import { sm3Bytes, sm3Hex } from './sm3'

/** CRC32 (IEEE 802.3) */
const CRC32_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c >>> 0
  }
  return t
})()

/** CRC32C (Castagnoli) */
const CRC32C_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0x82f63b78 ^ (c >>> 1) : c >>> 1
    t[i] = c >>> 0
  }
  return t
})()

export function crc32Bytes(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ bytes[i]!) & 0xff]!
  }
  return (crc ^ 0xffffffff) >>> 0
}

export function crc32cBytes(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC32C_TABLE[(crc ^ bytes[i]!) & 0xff]!
  }
  return (crc ^ 0xffffffff) >>> 0
}

export function adler32Bytes(bytes: Uint8Array): number {
  let a = 1
  let b = 0
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]!) % 65521
    b = (b + a) % 65521
  }
  return ((b << 16) | a) >>> 0
}

function toHex8(n: number): string {
  return n.toString(16).padStart(8, '0')
}

/** 兼容旧调用：CRC32 hex */
export function crc32(text: string): string {
  return toHex8(crc32Bytes(encodeUtf8(text)))
}

export type HashExtAlgo = 'crc32' | 'crc32c' | 'adler32' | 'sm3'

export type HashExtItem = {
  id: HashExtAlgo
  label: string
  value: string
  error?: boolean
}

export const HASHEXT_ALGOS: { id: HashExtAlgo; label: string }[] = [
  { id: 'crc32', label: 'CRC32 (IEEE 802.3)' },
  { id: 'crc32c', label: 'CRC32C (Castagnoli)' },
  { id: 'adler32', label: 'Adler32' },
  { id: 'sm3', label: 'SM3 (国密)' },
]

export function hashExtDigest(algo: HashExtAlgo, raw: string): string {
  const data = encodeUtf8(raw)
  switch (algo) {
    case 'crc32':
      return toHex8(crc32Bytes(data))
    case 'crc32c':
      return toHex8(crc32cBytes(data))
    case 'adler32':
      return toHex8(adler32Bytes(data))
    case 'sm3':
      return sm3Bytes(data)
    default:
      throw new Error('未知算法')
  }
}

/** 计算全部扩展摘要（对齐旧站） */
export function hashExtAll(raw: string): HashExtItem[] {
  const data = encodeUtf8(raw)
  const items: HashExtItem[] = [
    { id: 'crc32', label: 'CRC32 (IEEE 802.3)', value: toHex8(crc32Bytes(data)) },
    { id: 'crc32c', label: 'CRC32C (Castagnoli)', value: toHex8(crc32cBytes(data)) },
    { id: 'adler32', label: 'Adler32', value: toHex8(adler32Bytes(data)) },
  ]
  try {
    items.push({ id: 'sm3', label: 'SM3 (国密)', value: sm3Bytes(data) })
  } catch (e) {
    items.push({
      id: 'sm3',
      label: 'SM3 (国密)',
      value: '计算失败: ' + (e instanceof Error ? e.message : String(e)),
      error: true,
    })
  }
  return items
}

export { sm3Hex }
