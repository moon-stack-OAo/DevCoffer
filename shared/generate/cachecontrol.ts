/** Cache-Control 头生成 */

export const CACHE_CONTROL_PRESETS = [
    {
        id: 'no-cache-store',
        name: '无缓存',
        opts: {
            scope: 'private' as const,
            noStore: true,
            noCache: false,
            mustRevalidate: false,
            immutable: false,
            maxAge: '',
            sMaxAge: '',
            swr: '',
            sie: '',
            includeExpires: false,
            vary: '',
        },
    },
    {
        id: 'revalidate',
        name: '协商缓存',
        opts: {
            scope: 'public' as const,
            noStore: false,
            noCache: true,
            mustRevalidate: true,
            immutable: false,
            maxAge: '0',
            sMaxAge: '',
            swr: '',
            sie: '',
            includeExpires: false,
            vary: 'Accept-Encoding',
        },
    },
    {
        id: 'short-5m',
        name: '短缓存 5min',
        opts: {
            scope: 'public' as const,
            noStore: false,
            noCache: false,
            mustRevalidate: false,
            immutable: false,
            maxAge: '300',
            sMaxAge: '300',
            swr: '60',
            sie: '',
            includeExpires: true,
            vary: 'Accept-Encoding',
        },
    },
    {
        id: 'long-1y',
        name: '长缓存 1y',
        opts: {
            scope: 'public' as const,
            noStore: false,
            noCache: false,
            mustRevalidate: false,
            immutable: true,
            maxAge: '31536000',
            sMaxAge: '31536000',
            swr: '',
            sie: '',
            includeExpires: true,
            vary: 'Accept-Encoding',
        },
    },
]

function parseOptionalSec(v: unknown): number | null {
    if (v == null || v === '') return null
    const n = Number(v)
    if (!isFinite(n) || n < 0) return NaN
    return Math.floor(n)
}

export function cacheControlFormatDuration(sec: number): string {
    const n = Number(sec)
    if (!isFinite(n) || n < 0) return String(sec)
    if (n === 0) return '0 秒'
    if (n % 31536000 === 0) return n / 31536000 + ' 年'
    if (n % 86400 === 0) return n / 86400 + ' 天'
    if (n % 3600 === 0) return n / 3600 + ' 小时'
    if (n % 60 === 0) return n / 60 + ' 分钟'
    return n + ' 秒'
}

export type CacheControlOpts = {
    scope?: 'public' | 'private'
    noStore?: boolean
    noCache?: boolean
    mustRevalidate?: boolean
    proxyRevalidate?: boolean
    immutable?: boolean
    maxAge?: string | number
    sMaxAge?: string | number
    swr?: string | number
    sie?: string | number
    includeExpires?: boolean
    vary?: string
    now?: Date
}

export function cacheControlBuild(opts?: CacheControlOpts): {
    ok: boolean
    cacheControl?: string
    headersText?: string
    summary?: string
    msg?: string
} {
    const o = opts || {}
    const scope = o.scope === 'private' ? 'private' : 'public'
    const noStore = !!o.noStore
    const noCache = !!o.noCache
    const mustRevalidate = !!o.mustRevalidate
    const proxyRevalidate = !!o.proxyRevalidate
    const immutable = !!o.immutable
    const maxAge = parseOptionalSec(o.maxAge)
    const sMaxAge = parseOptionalSec(o.sMaxAge)
    const swr = parseOptionalSec(o.swr)
    const sie = parseOptionalSec(o.sie)
    if (
        (maxAge !== null && isNaN(maxAge)) ||
        (sMaxAge !== null && isNaN(sMaxAge)) ||
        (swr !== null && isNaN(swr)) ||
        (sie !== null && isNaN(sie))
    ) {
        return { ok: false, msg: '时间字段须为非负整数秒' }
    }

    const directives: string[] = []
    let warning = ''
    if (noStore) {
        directives.push('no-store')
        if (noCache || mustRevalidate || immutable || maxAge !== null || sMaxAge !== null) {
            warning = 'no-store 时已忽略其它缓存指令'
        }
    } else {
        directives.push(scope)
        if (noCache) directives.push('no-cache')
        if (mustRevalidate) directives.push('must-revalidate')
        if (proxyRevalidate) directives.push('proxy-revalidate')
        if (maxAge !== null) directives.push('max-age=' + maxAge)
        if (sMaxAge !== null) directives.push('s-maxage=' + sMaxAge)
        if (swr !== null) directives.push('stale-while-revalidate=' + swr)
        if (sie !== null) directives.push('stale-if-error=' + sie)
        if (immutable) directives.push('immutable')
    }

    const cacheControl = directives.join(', ')
    const headerLines = ['Cache-Control: ' + cacheControl]
    const includeExpires = !!o.includeExpires && !noStore && maxAge !== null
    if (includeExpires) {
        const d = o.now instanceof Date ? new Date(o.now.getTime()) : new Date()
        d.setTime(d.getTime() + maxAge! * 1000)
        headerLines.push('Expires: ' + d.toUTCString())
    }
    const vary = o.vary != null ? String(o.vary).trim() : ''
    if (vary) headerLines.push('Vary: ' + vary)

    const summaryParts: string[] = []
    if (noStore) summaryParts.push('禁止存储')
    else {
        summaryParts.push(scope === 'public' ? '可被共享缓存' : '仅私有缓存')
        if (maxAge !== null) summaryParts.push('新鲜度 ' + cacheControlFormatDuration(maxAge))
        if (immutable) summaryParts.push('immutable')
        if (noCache) summaryParts.push('使用前须再验证')
    }
    if (warning) summaryParts.push(warning)

    return {
        ok: true,
        cacheControl,
        headersText: headerLines.join('\n'),
        summary: summaryParts.join('；'),
    }
}