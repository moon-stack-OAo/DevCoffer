/** JWT 解析（仅展示 header/payload，不验签） */

function padBase64Url(s: string): string {
    const pad = s.length % 4
    if (pad === 0) return s
    return s + '='.repeat(4 - pad)
}

export function jwtDecodeSegment(seg: string): string {
    const b64 = padBase64Url(seg.replace(/-/g, '+').replace(/_/g, '/'))
    if (typeof atob === 'function') {
        const bin = atob(b64)
        const bytes = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
        return new TextDecoder().decode(bytes)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const B = (globalThis as any).Buffer
    if (B) return B.from(b64, 'base64').toString('utf8')
    throw new Error('当前环境不支持 Base64 解码')
}

export type JwtParseResult = {
    header: Record<string, unknown>
    payload: Record<string, unknown>
    signature: string
    expired: boolean | null
    expIso: string | null
}

export function parseJwt(token: string): JwtParseResult {
    const raw = String(token || '').trim()
    if (!raw) throw new Error('请输入 JWT Token')
    const parts = raw.split('.')
    if (parts.length !== 3) throw new Error('无效的 JWT 格式（需要 3 段）')
    const header = JSON.parse(jwtDecodeSegment(parts[0]!)) as Record<string, unknown>
    const payload = JSON.parse(jwtDecodeSegment(parts[1]!)) as Record<string, unknown>
    const signature = parts[2]!
    let expired: boolean | null = null
    let expIso: string | null = null
    if (typeof payload.exp === 'number') {
        const e = new Date(payload.exp * 1000)
        expIso = e.toISOString()
        expired = e.getTime() < Date.now()
    }
    return { header, payload, signature, expired, expIso }
}