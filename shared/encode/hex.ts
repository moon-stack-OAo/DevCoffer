/** 文本 ↔ 十六进制（UTF-8） */

function encodeUtf8(text: string): Uint8Array {
    if (typeof TextEncoder !== 'undefined') {
        return new TextEncoder().encode(text)
    }
    const buf = Buffer.from(text, 'utf8')
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
}

function decodeUtf8(bytes: Uint8Array): string {
    if (typeof TextDecoder !== 'undefined') {
        return new TextDecoder().decode(bytes)
    }
    return Buffer.from(bytes).toString('utf8')
}

export function encodeHex(text: string, sep = ''): string {
    const bytes = encodeUtf8(text)
    const parts: string[] = []
    for (let i = 0; i < bytes.length; i++) {
        parts.push(bytes[i]!.toString(16).padStart(2, '0'))
    }
    return parts.join(sep)
}

export function decodeHex(hex: string): string {
    const cleaned = hex.replace(/[\s,:_-]/g, '')
    if (!cleaned) return ''
    if (cleaned.length % 2 !== 0) {
        throw new Error('十六进制长度必须为偶数')
    }
    if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
        throw new Error('包含非法十六进制字符')
    }
    const bytes = new Uint8Array(cleaned.length / 2)
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16)
    }
    return decodeUtf8(bytes)
}
