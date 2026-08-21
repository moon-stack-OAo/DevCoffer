/** OAuth2 PKCE：verifier / challenge(S256) / authorize URL */

import { base64UrlEncode, encodeUtf8, isSubtleAvailable, randomBytes } from './crypto-bytes'

async function pkceSha256(text: string): Promise<Uint8Array> {
    if (!isSubtleAvailable()) throw new Error('当前环境不支持 Web Crypto SubtleCrypto')
    const dig = await crypto.subtle.digest('SHA-256', encodeUtf8(text))
    return new Uint8Array(dig)
}

export type PkcePair = {
    code_verifier: string
    code_challenge: string
    code_challenge_method: string
}

export async function generatePkce(options?: {
    verifierLength?: number
    verifier?: string
}): Promise<PkcePair> {
    const opts = options || {}
    let verifier = opts.verifier
    if (!verifier) {
        let len = opts.verifierLength == null ? 64 : Number(opts.verifierLength)
        if (!isFinite(len)) len = 64
        if (len < 43) len = 43
        if (len > 128) len = 128
        const bytes = randomBytes(Math.ceil((len * 3) / 4) + 4)
        verifier = base64UrlEncode(bytes).slice(0, len)
        while (verifier.length < len) {
            verifier += base64UrlEncode(randomBytes(32))
            verifier = verifier.slice(0, len)
        }
    }
    if (verifier.length < 43 || verifier.length > 128) {
        throw new Error('code_verifier 长度须为 43–128')
    }
    if (!/^[A-Za-z0-9\-._~]+$/.test(verifier)) {
        throw new Error('code_verifier 含非法字符')
    }
    const hash = await pkceSha256(verifier)
    return {
        code_verifier: verifier,
        code_challenge: base64UrlEncode(hash),
        code_challenge_method: 'S256',
    }
}

export function buildAuthorizeUrl(params: {
    authorizeUrl: string
    clientId: string
    redirectUri: string
    codeChallenge: string
    scope?: string
    state?: string
    codeChallengeMethod?: string
    extra?: Record<string, string>
}): string {
    const base = String(params.authorizeUrl || '').trim()
    if (!base) throw new Error('缺少 authorizeUrl')
    if (params.clientId == null || params.clientId === '') throw new Error('缺少 client_id')
    if (params.redirectUri == null || params.redirectUri === '') throw new Error('缺少 redirect_uri')
    if (params.codeChallenge == null || params.codeChallenge === '') throw new Error('缺少 code_challenge')

    const q: string[] = []
    const add = (k: string, v: string | undefined | null) => {
        if (v === undefined || v === null || v === '') return
        q.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(v)))
    }
    add('response_type', 'code')
    add('client_id', params.clientId)
    add('redirect_uri', params.redirectUri)
    add('code_challenge', params.codeChallenge)
    add('code_challenge_method', params.codeChallengeMethod || 'S256')
    add('scope', params.scope)
    add('state', params.state)
    if (params.extra) {
        for (const [k, v] of Object.entries(params.extra)) add(k, v)
    }
    const sep = base.includes('?') ? '&' : '?'
    return base + sep + q.join('&')
}