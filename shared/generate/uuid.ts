/** UUID v4 生成（优先 crypto.getRandomValues） */

function randomBytes(len: number): Uint8Array {
    const out = new Uint8Array(len)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(out)
        return out
    }
    for (let i = 0; i < len; i++) out[i] = Math.floor(Math.random() * 256)
    return out
}

export function generateUuidV4(): string {
    const bytes = randomBytes(16)
    bytes[6] = (bytes[6]! & 0x0f) | 0x40
    bytes[8] = (bytes[8]! & 0x3f) | 0x80
    const hex: string[] = []
    for (let i = 0; i < 16; i++) hex.push(bytes[i]!.toString(16).padStart(2, '0'))
    return (
        hex.slice(0, 4).join('') +
        '-' +
        hex.slice(4, 6).join('') +
        '-' +
        hex.slice(6, 8).join('') +
        '-' +
        hex.slice(8, 10).join('') +
        '-' +
        hex.slice(10, 16).join('')
    )
}

export type UuidFormatOptions = {
    uppercase?: boolean
    noHyphen?: boolean
}

export function formatUuid(uuid: string, opts?: UuidFormatOptions): string {
    let s = uuid
    if (opts?.noHyphen) s = s.replace(/-/g, '')
    if (opts?.uppercase) s = s.toUpperCase()
    return s
}

export function generateUuids(count: number, opts?: UuidFormatOptions): string[] {
    const n = Math.max(1, Math.min(500, Math.floor(count) || 1))
    const list: string[] = []
    for (let i = 0; i < n; i++) list.push(formatUuid(generateUuidV4(), opts))
    return list
}
