/** ULID / NanoID */

import { randomBytes } from '../security/crypto-bytes'

const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const ULID_LOOKUP: Record<string, number> = (() => {
    const map: Record<string, number> = Object.create(null)
    for (let i = 0; i < ULID_ALPHABET.length; i++) {
        map[ULID_ALPHABET[i]!] = i
        map[ULID_ALPHABET[i]!.toLowerCase()] = i
    }
    map.I = map.i = 1
    map.L = map.l = 1
    map.O = map.o = 0
    return map
})()

const NANOID_ALPHABETS = {
    default: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    'url-safe': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-',
}

function encodeTime(ms: number, len = 10): string {
    let t = Number(ms)
    if (!Number.isFinite(t) || t < 0) throw new Error('无效时间戳')
    if (t > 0xffffffffffff) throw new Error('时间戳超过 48 位')
    let str = ''
    for (let i = len; i > 0; i--) {
        const mod = t % 32
        str = ULID_ALPHABET[mod] + str
        t = Math.floor(t / 32)
    }
    return str
}

function encodeRandom(len = 16): string {
    const bytes = randomBytes(len)
    let str = ''
    for (let i = 0; i < len; i++) str += ULID_ALPHABET[bytes[i]! & 31]
    return str
}

export function generateUlid(time?: number): string {
    const ts = time == null ? Date.now() : Number(time)
    return encodeTime(ts, 10) + encodeRandom(16)
}

export function parseUlid(id: string): {
    id: string
    timestamp: number
    iso: string
    localTime: string
} {
    const raw = String(id ?? '').trim()
    if (!raw) throw new Error('ULID 为空')
    if (raw.length !== 26) throw new Error('ULID 须为 26 个字符')
    let time = 0
    for (let i = 0; i < 10; i++) {
        const v = ULID_LOOKUP[raw[i]!]
        if (v === undefined) throw new Error('非法 ULID 字符: ' + raw[i])
        time = time * 32 + v
    }
    for (let i = 10; i < 26; i++) {
        if (ULID_LOOKUP[raw[i]!] === undefined) throw new Error('非法 ULID 字符: ' + raw[i])
    }
    const d = new Date(time)
    if (isNaN(d.getTime())) throw new Error('无法解析时间戳')
    const pad = (n: number, w = 2) => String(n).padStart(w, '0')
    const localTime =
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
    return {
        id: raw.toUpperCase().replace(/[ILO]/g, (c) => {
            const u = c.toUpperCase()
            if (u === 'I' || u === 'L') return '1'
            if (u === 'O') return '0'
            return c
        }),
        timestamp: time,
        iso: d.toISOString(),
        localTime,
    }
}

export function generateNanoid(size = 21, alphabet?: string): string {
    const len = Math.min(Math.max(parseInt(String(size), 10) || 21, 2), 64)
    const chars = alphabet && alphabet.length >= 2 ? alphabet : NANOID_ALPHABETS.default
    const n = chars.length
    const maxValid = 256 - (256 % n)
    let result = ''
    let remaining = len
    let attempts = 0
    while (remaining > 0) {
        const arr = randomBytes(remaining)
        let written = 0
        for (let i = 0; i < remaining; i++) {
            if (arr[i]! < maxValid) {
                result += chars[arr[i]! % n]
                written++
            }
        }
        remaining -= written
        attempts++
        if (attempts > 100) break
    }
    return result
}

export function generateNanoidByKey(size = 21, alphabetKey: 'default' | 'url-safe' = 'default') {
    return generateNanoid(size, NANOID_ALPHABETS[alphabetKey])
}

export function generateUlids(count: number, time?: number): string[] {
    const n = Math.max(1, Math.min(100, Math.floor(count) || 1))
    const list: string[] = []
    for (let i = 0; i < n; i++) list.push(generateUlid(time))
    return list
}