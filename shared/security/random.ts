/** 随机密码 / Hex Token / PIN */

import { randomBytes } from './crypto-bytes'

export function randGen(len: number, chars: string): string {
    const n = chars.length
    if (n < 1) throw new Error('字符集为空')
    const size = Math.max(1, Math.min(512, Math.floor(len) || 1))
    const maxValid = 256 - (256 % n)
    let result = ''
    let remaining = size
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

export type RandomCharsetOpts = {
    upper?: boolean
    lower?: boolean
    digit?: boolean
    special?: boolean
}

export function buildCharset(opts: RandomCharsetOpts): string {
    let chars = ''
    if (opts.upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (opts.lower) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (opts.digit) chars += '0123456789'
    if (opts.special) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    return chars
}

export function generatePassword(len: number, opts: RandomCharsetOpts): string {
    const chars = buildCharset(opts)
    if (!chars) throw new Error('请至少选择一个字符集')
    return randGen(len, chars)
}

export function generateHexToken(byteLen: number): string {
    const n = Math.max(1, Math.min(256, Math.floor(byteLen) || 32))
    const bytes = randomBytes(n)
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

export function generatePin(digits = 6): string {
    return randGen(Math.max(4, Math.min(12, digits)), '0123456789')
}