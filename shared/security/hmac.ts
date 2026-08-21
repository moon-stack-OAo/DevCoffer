/** HMAC：MD5 纯 JS；SHA 系列 SubtleCrypto */

import { bytesToBase64, bytesToHex, encodeUtf8, isSubtleAvailable } from './crypto-bytes'
import { hmacMd5Bytes } from './md5'

export type HmacAlgo = 'MD5' | 'SHA1' | 'SHA256' | 'SHA384' | 'SHA512'
export type HmacFormat = 'hex' | 'base64'

const ALGO_MAP: Record<Exclude<HmacAlgo, 'MD5'>, string> = {
    SHA1: 'SHA-1',
    SHA256: 'SHA-256',
    SHA384: 'SHA-384',
    SHA512: 'SHA-512',
}

export async function hmacSign(
    key: string,
    msg: string,
    algo: HmacAlgo,
    outFmt: HmacFormat = 'hex',
): Promise<string> {
    const data = encodeUtf8(msg)
    if (algo === 'MD5') {
        const mac = hmacMd5Bytes(encodeUtf8(key), data)
        return outFmt === 'hex' ? bytesToHex(mac) : bytesToBase64(mac)
    }
    if (!isSubtleAvailable()) throw new Error('当前环境不支持 Web Crypto SubtleCrypto')
    const hashName = ALGO_MAP[algo]
    if (!hashName) throw new Error('不支持的算法: ' + algo)
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        encodeUtf8(key),
        { name: 'HMAC', hash: hashName },
        false,
        ['sign'],
    )
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, data)
    return outFmt === 'hex' ? bytesToHex(sig) : bytesToBase64(new Uint8Array(sig))
}