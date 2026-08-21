/** 字节与 hex/base64 工具（无 DOM） */

export function bytesToHex(buf: ArrayBuffer | Uint8Array): string {
    const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
    let out = ''
    for (let i = 0; i < arr.length; i++) out += arr[i]!.toString(16).padStart(2, '0')
    return out
}

export function bytesToBase64(bytes: Uint8Array): string {
    let bin = ''
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) {
        bin += String.fromCharCode(...bytes.subarray(i, i + chunk))
    }
    if (typeof btoa === 'function') return btoa(bin)
    // Node / SSR 兜底
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const B = (globalThis as any).Buffer
    if (B) return B.from(bytes).toString('base64')
    throw new Error('当前环境不支持 Base64')
}

export function base64UrlEncode(buf: ArrayBuffer | Uint8Array): string {
    const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
    return bytesToBase64(arr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function randomBytes(len: number): Uint8Array {
    const out = new Uint8Array(len)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(out)
        return out
    }
    for (let i = 0; i < len; i++) out[i] = Math.floor(Math.random() * 256)
    return out
}

export function isSubtleAvailable(): boolean {
    return typeof crypto !== 'undefined' && !!crypto.subtle
}

export function encodeUtf8(text: string): Uint8Array {
    return new TextEncoder().encode(text)
}