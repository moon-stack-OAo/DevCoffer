/** CORS 响应头生成 */

export const CORS_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']

function dedupeHeaders(list: string[]): string[] {
    const seen: Record<string, boolean> = Object.create(null)
    const out: string[] = []
    for (const h of list) {
        const t = String(h).trim()
        if (!t) continue
        const key = t.toLowerCase()
        if (seen[key]) continue
        seen[key] = true
        out.push(t)
    }
    return out
}

export type CorsOpts = {
    originMode?: 'star' | 'custom'
    origin?: string
    credentials?: boolean
    methods?: string[]
    allowHeaders?: string[]
    allowHeadersCustom?: string
    exposeHeaders?: string[]
    exposeHeadersCustom?: string
    maxAge?: number | string
    includePreflight?: boolean
}

export function corsBuildHeaders(opts?: CorsOpts): {
    ok: boolean
    headers?: string[]
    text?: string
    nginx?: string
    express?: string
    msg?: string
} {
    const o = opts || {}
    let originMode = o.originMode === 'custom' ? 'custom' : 'star'
    let origin = '*'
    const customRaw = o.origin != null ? String(o.origin) : ''
    const customOrigins = customRaw
        .split(/[\r\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean)

    if (originMode === 'custom') {
        if (!customOrigins.length) return { ok: false, msg: '请填写至少一个 Origin' }
        origin = customOrigins[0]!
    }

    const credentials = !!o.credentials
    if (credentials && origin === '*') {
        return {
            ok: false,
            msg: 'Allow-Credentials 为 true 时，Allow-Origin 不能为 *，请指定具体 Origin',
        }
    }

    let methods = Array.isArray(o.methods) ? o.methods.slice() : []
    methods = methods.map((m) => String(m).trim().toUpperCase()).filter(Boolean)
    if (!methods.length) methods = ['GET', 'POST']
    const methodSeen: Record<string, boolean> = Object.create(null)
    methods = methods.filter((m) => {
        if (methodSeen[m]) return false
        methodSeen[m] = true
        return true
    })

    let allowHeaders: string[] = Array.isArray(o.allowHeaders) ? o.allowHeaders.slice() : []
    if (o.allowHeadersCustom) {
        for (const h of String(o.allowHeadersCustom)
            .split(/[\r\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean)) {
            allowHeaders.push(h)
        }
    }
    allowHeaders = dedupeHeaders(allowHeaders)
    if (!allowHeaders.length) allowHeaders = ['Content-Type', 'Authorization']

    let exposeHeaders: string[] = Array.isArray(o.exposeHeaders) ? o.exposeHeaders.slice() : []
    if (o.exposeHeadersCustom) {
        for (const h of String(o.exposeHeadersCustom)
            .split(/[\r\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean)) {
            exposeHeaders.push(h)
        }
    }
    exposeHeaders = dedupeHeaders(exposeHeaders)

    let maxAge = o.maxAge
    if (maxAge == null || maxAge === '') maxAge = 86400
    maxAge = Number(maxAge)
    if (!isFinite(maxAge) || maxAge < 0) return { ok: false, msg: 'Max-Age 须为非负整数秒' }
    maxAge = Math.floor(maxAge)

    const includePreflight = o.includePreflight !== false
    const headers = [
        'Access-Control-Allow-Origin: ' + origin,
        'Access-Control-Allow-Methods: ' + methods.join(', '),
        'Access-Control-Allow-Headers: ' + allowHeaders.join(', '),
    ]
    if (exposeHeaders.length) {
        headers.push('Access-Control-Expose-Headers: ' + exposeHeaders.join(', '))
    }
    if (credentials) headers.push('Access-Control-Allow-Credentials: true')
    headers.push('Access-Control-Max-Age: ' + maxAge)
    if (credentials) headers.push('Vary: Origin')

    let text = headers.join('\n')
    if (customOrigins.length > 1) {
        text +=
            '\n\n# 提示: 多个 Origin 需服务端按请求动态回显\n' +
            customOrigins
                .slice(1)
                .map((x) => '#   Access-Control-Allow-Origin: ' + x)
                .join('\n')
    }
    if (includePreflight) {
        text +=
            '\n\n# --- OPTIONS 预检 ---\n' +
            '# 对 OPTIONS 返回 204/200 并附带上述 CORS 头；Max-Age 控制预检缓存。'
    }

    const nginx =
        '# Nginx\n' +
        headers
            .map((line) => {
                const idx = line.indexOf(':')
                const name = line.slice(0, idx).trim()
                const val = line.slice(idx + 1).trim()
                return 'add_header ' + name + ' "' + val.replace(/"/g, '\\"') + '" always;'
            })
            .join('\n')

    const expressObj: Record<string, string> = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': methods.join(', '),
        'Access-Control-Allow-Headers': allowHeaders.join(', '),
        'Access-Control-Max-Age': String(maxAge),
    }
    if (exposeHeaders.length) expressObj['Access-Control-Expose-Headers'] = exposeHeaders.join(', ')
    if (credentials) {
        expressObj['Access-Control-Allow-Credentials'] = 'true'
        expressObj['Vary'] = 'Origin'
    }
    const express =
        '// Express\napp.use((req, res, next) => {\n  res.set(' +
        JSON.stringify(expressObj, null, 2).replace(/\n/g, '\n  ') +
        ');\n  if (req.method === "OPTIONS") return res.sendStatus(204);\n  next();\n});'

    return { ok: true, headers, text, nginx, express }
}