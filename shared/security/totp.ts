/** TOTP / HOTP（RFC 6238 / 4226），HMAC 走 SubtleCrypto */

import { encodeUtf8, isSubtleAvailable } from './crypto-bytes'

const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Decode(input: string): Uint8Array {
    const cleaned = input.replace(/[\s=-]/g, '').toUpperCase()
    const bytes: number[] = []
    let buffer = 0
    let bits = 0
    for (const c of cleaned) {
        const val = B32_ALPHABET.indexOf(c)
        if (val < 0) throw new Error('非法 Base32 字符: ' + c)
        buffer = (buffer << 5) | val
        bits += 5
        if (bits >= 8) {
            bytes.push((buffer >> (bits - 8)) & 0xff)
            bits -= 8
        }
    }
    return new Uint8Array(bytes)
}

async function hmacHash(key: Uint8Array, message: Uint8Array, algorithm: string): Promise<Uint8Array> {
    if (!isSubtleAvailable()) throw new Error('当前环境不支持 Web Crypto SubtleCrypto')
    const algoMap: Record<string, string> = {
        SHA1: 'SHA-1',
        'SHA-1': 'SHA-1',
        SHA256: 'SHA-256',
        'SHA-256': 'SHA-256',
        SHA512: 'SHA-512',
        'SHA-512': 'SHA-512',
    }
    const hashName = algoMap[algorithm] || 'SHA-1'
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: hashName }, false, [
        'sign',
    ])
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, message)
    return new Uint8Array(sig)
}

export async function generateOtp(
    secretB32: string,
    counter: number,
    digits = 6,
    algorithm = 'SHA-1',
): Promise<string> {
    const key = base32Decode(secretB32)
    const counterBytes = new Uint8Array(8)
    let c = counter
    for (let i = 7; i >= 0; i--) {
        counterBytes[i] = c & 0xff
        c = Math.floor(c / 256)
    }
    const hash = await hmacHash(key, counterBytes, algorithm)
    const offset = hash[hash.length - 1]! & 0x0f
    const code =
        ((hash[offset]! & 0x7f) << 24) |
        ((hash[offset + 1]! & 0xff) << 16) |
        ((hash[offset + 2]! & 0xff) << 8) |
        (hash[offset + 3]! & 0xff)
    return String(code % Math.pow(10, digits)).padStart(digits, '0')
}

export async function totp(
    secretB32: string,
    time?: number,
    period = 30,
    digits = 6,
    algorithm = 'SHA-1',
): Promise<string> {
    const t = time == null ? Date.now() : time
    const counter = Math.floor(t / 1000 / period)
    return generateOtp(secretB32, counter, digits, algorithm)
}

export async function hotp(
    secretB32: string,
    counter = 0,
    digits = 6,
    algorithm = 'SHA-1',
): Promise<string> {
    return generateOtp(secretB32, counter, digits, algorithm)
}

export async function verifyOtp(
    input: string,
    secretB32: string,
    period = 30,
    digits = 6,
    algorithm = 'SHA-1',
): Promise<{ valid: boolean; offset?: number }> {
    const trimmed = String(input ?? '').replace(/\s+/g, '')
    if (!trimmed) return { valid: false }
    const now = Date.now()
    for (const offset of [-1, 0, 1]) {
        const time = now + offset * period * 1000
        const code = await totp(secretB32, time, period, digits, algorithm)
        if (code === trimmed) return { valid: true, offset }
    }
    return { valid: false }
}

export function formatOtp(code: string, digits?: number): string {
    const d = digits || (code ? code.length : 6)
    if (d === 6 && code.length === 6) return code.slice(0, 3) + ' ' + code.slice(3)
    if (d === 8 && code.length === 8) return code.slice(0, 4) + ' ' + code.slice(4)
    return code
}

export function remainingSeconds(period = 30, now = Date.now()): number {
    const p = Math.max(1, period)
    return p - (Math.floor(now / 1000) % p)
}

export type OtpauthInfo = {
    type: string
    issuer: string
    account: string
    secret: string
    algorithm: string
    digits: number
    period: number
    counter: number | null
}

export function parseOtpauthUri(uri: string): OtpauthInfo {
    if (!uri || typeof uri !== 'string') throw new Error('URI 不能为空')
    const trimmed = uri.trim()
    if (!trimmed.toLowerCase().startsWith('otpauth://')) {
        throw new Error('URI 必须以 otpauth:// 开头')
    }
    const url = new URL(trimmed)
    if (url.protocol !== 'otpauth:') throw new Error('非 otpauth URI')
    const type = (url.host || '').toLowerCase()
    if (type !== 'totp' && type !== 'hotp') throw new Error('不支持的 OTP 类型: ' + type)
    const rawLabel = url.pathname.replace(/^\/+/, '')
    const label = rawLabel ? decodeURIComponent(rawLabel) : ''
    const secret = url.searchParams.get('secret')
    if (!secret) throw new Error('URI 缺少 secret 参数')
    let issuer = url.searchParams.get('issuer') || ''
    let account = label
    const colonIdx = label.indexOf(':')
    if (colonIdx >= 0) {
        const labelIssuer = label.slice(0, colonIdx).trim()
        const labelAccount = label.slice(colonIdx + 1).trim()
        if (labelIssuer && !issuer) issuer = labelIssuer
        if (labelAccount) account = labelAccount
    }
    let algo = (url.searchParams.get('algorithm') || 'SHA1').toUpperCase()
    if (algo === 'SHA1') algo = 'SHA-1'
    else if (algo === 'SHA256') algo = 'SHA-256'
    else if (algo === 'SHA512') algo = 'SHA-512'
    const digits = parseInt(url.searchParams.get('digits') || '6', 10) || 6
    const period = parseInt(url.searchParams.get('period') || '30', 10) || 30
    const counterStr = url.searchParams.get('counter')
    const counter = counterStr != null ? parseInt(counterStr, 10) : null
    return { type, issuer, account, secret, algorithm: algo, digits, period, counter }
}