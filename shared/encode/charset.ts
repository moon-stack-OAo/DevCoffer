/** 字符编码：UTF-8 文本↔字节；字节按 TextDecoder 多编码解码（浏览器能力） */

export const CHARSET_ENCODINGS = [
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'gbk', label: 'GBK' },
  { value: 'gb18030', label: 'GB18030' },
  { value: 'gb2312', label: 'GB2312' },
  { value: 'big5', label: 'Big5' },
  { value: 'shift_jis', label: 'Shift_JIS' },
  { value: 'euc-jp', label: 'EUC-JP' },
  { value: 'euc-kr', label: 'EUC-KR' },
  { value: 'iso-8859-1', label: 'ISO-8859-1' },
  { value: 'windows-1252', label: 'Windows-1252' },
] as const

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let bin = ''
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
    return btoa(bin)
  }
  return Buffer.from(bytes).toString('base64')
}

export function parseHex(hex: string): Uint8Array {
  const cleaned = String(hex || '')
    .replace(/0x/gi, '')
    .replace(/[\s,;:_-]/g, '')
  if (!cleaned) throw new Error('Hex 为空')
  if (!/^[0-9a-fA-F]+$/.test(cleaned) || cleaned.length % 2 !== 0) {
    throw new Error('非法 Hex（需偶数位 0-9a-fA-F，可含空格/0x）')
  }
  const pairs = cleaned.match(/.{1,2}/g) || []
  return new Uint8Array(pairs.map((h) => parseInt(h, 16)))
}

export function parseBase64(b64: string): Uint8Array {
  const cleaned = String(b64 || '')
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  if (!cleaned) throw new Error('Base64 为空')
  try {
    if (typeof atob === 'function') {
      const bin = atob(cleaned)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      return bytes
    }
    return new Uint8Array(Buffer.from(cleaned, 'base64'))
  } catch {
    throw new Error('非法 Base64')
  }
}

export function textToUtf8Bytes(text: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text)
  return new Uint8Array(Buffer.from(text, 'utf8'))
}

export function decodeBytes(bytes: Uint8Array, encoding: string, fatal = false): string {
  if (typeof TextDecoder === 'undefined') {
    if (encoding === 'utf-8' || encoding === 'utf8') return Buffer.from(bytes).toString('utf8')
    throw new Error('当前环境不支持 TextDecoder: ' + encoding)
  }
  return new TextDecoder(encoding, { fatal }).decode(bytes)
}

export function isEncodingSupported(encoding: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new TextDecoder(encoding)
    return true
  } catch {
    return false
  }
}

/** 同一份字节用多种编码解码对照（含字节摘要与 U+FFFD 提示） */
export function multiDecode(
  bytes: Uint8Array,
  encodings: readonly { value: string; label: string }[] = CHARSET_ENCODINGS,
): string {
  const lines: string[] = []
  const hexPreview = bytesToHex(bytes).slice(0, 64)
  lines.push(
    '输入字节: ' + bytes.length + ' B | Hex: ' + hexPreview + (bytes.length > 32 ? '…' : ''),
  )
  lines.push('—— 多编码解码对照（便于乱码还原）——')
  for (const item of encodings) {
    const label = item.label.padEnd(14)
    if (!isEncodingSupported(item.value)) {
      lines.push(label + '  [浏览器不支持]')
      continue
    }
    try {
      const text = decodeBytes(bytes, item.value, false)
      const bad = (text.match(/\uFFFD/g) || []).length
      const preview = text.length > 120 ? text.slice(0, 120) + '…' : text
      const flag = bad > 0 ? '  [含' + bad + '个替换符U+FFFD]' : ''
      lines.push(label + '  ' + preview + flag)
    } catch (e) {
      lines.push(label + '  [解码失败: ' + (e instanceof Error ? e.message : String(e)) + ']')
    }
  }
  lines.push('')
  lines.push('说明：本工具不能把文本编码为 GBK 等非 UTF-8 字节；编码输出仅支持 UTF-8。')
  return lines.join('\n')
}
