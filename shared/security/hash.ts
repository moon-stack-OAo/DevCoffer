/** Hash：MD5 纯 JS；SHA-* 走 SubtleCrypto（仅客户端） */

import { bytesToHex, encodeUtf8, isSubtleAvailable } from './crypto-bytes'
import { md5Hex } from './md5'

export type HashAlgo = 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512'

const ALGO_MAP: Record<Exclude<HashAlgo, 'md5'>, string> = {
    sha1: 'SHA-1',
    sha256: 'SHA-256',
    sha384: 'SHA-384',
    sha512: 'SHA-512',
}

export const HASH_ALGOS: { id: HashAlgo; label: string }[] = [
    { id: 'md5', label: 'MD5' },
    { id: 'sha1', label: 'SHA-1' },
    { id: 'sha256', label: 'SHA-256' },
    { id: 'sha384', label: 'SHA-384' },
    { id: 'sha512', label: 'SHA-512' },
]

export async function hashDigest(type: HashAlgo, raw: string): Promise<string> {
    if (type === 'md5') return md5Hex(raw)
    if (!isSubtleAvailable()) throw new Error('当前环境不支持 Web Crypto SubtleCrypto')
    const name = ALGO_MAP[type]
    if (!name) throw new Error('不支持的算法: ' + type)
    const buf = await crypto.subtle.digest(name, encodeUtf8(raw))
    return bytesToHex(buf)
}

export async function hashAll(raw: string): Promise<Record<HashAlgo, string>> {
    const out = {} as Record<HashAlgo, string>
    for (const a of HASH_ALGOS) {
        out[a.id] = await hashDigest(a.id, raw)
    }
    return out
}