/** 极简 protobuf wire 说明 / 手工 varint 编解码（非完整 .proto 编译器） */

import {
  grpcBase64ToBytes,
  grpcDecodeProtobuf,
  grpcHexToBytes,
} from '#shared/debug/grpc'

export function encodeVarint(n: number): number[] {
  const out: number[] = []
  let x = n >>> 0
  while (x >= 0x80) {
    out.push((x & 0x7f) | 0x80)
    x >>>= 7
  }
  out.push(x)
  return out
}

export function decodeVarint(bytes: number[]): { value: number; size: number } {
  let value = 0
  let size = 0
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]!
    value |= (b & 0x7f) << (7 * i)
    size++
    if ((b & 0x80) === 0) break
  }
  return { value: value >>> 0, size }
}

/** hex / base64 字符串 → 字节；非法时报中文错误 */
export function parseProtobufBytes(input: string, format: 'hex' | 'base64'): Uint8Array {
  const raw = String(input || '').trim()
  if (!raw) {
    throw new Error(format === 'hex' ? '请输入 Hex 字符串' : '请输入 Base64 字符串')
  }
  try {
    return format === 'hex' ? grpcHexToBytes(raw) : grpcBase64ToBytes(raw)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (format === 'hex') {
      throw new Error(msg.includes('Hex') ? msg : `非法 Hex：${msg}`)
    }
    throw new Error(msg.includes('Base64') ? msg : `非法 Base64：${msg}`)
  }
}

/** 无 schema 的通用 wire 解码，输出可读字段文本 */
export function decodeProtobufWire(bytes: Uint8Array): string {
  if (!bytes.length) throw new Error('字节为空，无法解码')
  return grpcDecodeProtobuf(bytes)
}

export function protobufHelp(jsonLike: string): string {
  let obj: Record<string, unknown> = {}
  try {
    obj = JSON.parse(jsonLike || '{}')
  } catch {
    throw new Error('请输入 JSON 示意字段，例如 {"1":"hello","2":123}')
  }
  const lines = [
    'Protobuf 浏览器完整编解码需 protobufjs / 预编译 schema。',
    '以下为字段示意 + varint 示例（非正式序列化）：',
    '',
  ]
  for (const [k, v] of Object.entries(obj)) {
    const field = Number(k)
    if (!Number.isFinite(field)) {
      lines.push(`字段 ${k}: ${JSON.stringify(v)} （非数字 field number）`)
      continue
    }
    if (typeof v === 'number') {
      const tag = (field << 3) | 0 // varint wire type
      lines.push(`field ${field} varint tag=${tag} valueBytes=[${encodeVarint(v).join(',')}]`)
    } else if (typeof v === 'string') {
      const tag = (field << 3) | 2 // length-delimited
      const data = [...new TextEncoder().encode(v)]
      lines.push(
        `field ${field} string tag=${tag} len=${data.length} utf8=[${data.slice(0, 24).join(',')}${data.length > 24 ? '…' : ''}]`,
      )
    } else {
      lines.push(`field ${field}: ${JSON.stringify(v)} （未展开）`)
    }
  }
  lines.push('', '正式方案：用 .proto + protoc / protobufjs 静态模块。')
  return lines.join('\n')
}
