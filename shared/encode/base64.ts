/** Base64 编解码（浏览器 TextEncoder/Decoder；Node 测可用 Buffer 回退） */

function encodeUtf8(text: string): Uint8Array {
    if (typeof TextEncoder !== 'undefined') {
        return new TextEncoder().encode(text)
    }
    // Node / 旧环境回退
    const buf = Buffer.from(text, 'utf8')
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
}

function decodeUtf8(bytes: Uint8Array): string {
    if (typeof TextDecoder !== 'undefined') {
        return new TextDecoder().decode(bytes)
    }
    return Buffer.from(bytes).toString('utf8')
}

function bytesToBase64(bytes: Uint8Array): string {
    if (typeof btoa === 'function') {
        let binary = ''
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
        return btoa(binary)
    }
    return Buffer.from(bytes).toString('base64')
}

function base64ToBytes(b64: string): Uint8Array {
    const cleaned = String(b64 || '')
        .replace(/\s+/g, '')
        .replace(/-/g, '+')
        .replace(/_/g, '/')
    try {
        if (typeof atob === 'function') {
            const binary = atob(cleaned)
            const out = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
            return out
        }
        return new Uint8Array(Buffer.from(cleaned, 'base64'))
    } catch {
        throw new Error('非法 Base64')
    }
}

export function encodeBase64(text: string): string {
    return bytesToBase64(encodeUtf8(text))
}

export function decodeBase64(b64: string): string {
    if (!b64.trim()) return ''
    return decodeUtf8(base64ToBytes(b64))
}
