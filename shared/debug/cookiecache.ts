/** Cookie / Set-Cookie 解析与构造；Cache-Control 构造 */

export function parseCookieHeader(raw: string): {
  pairs: { name: string; value: string }[]
  map: Record<string, string | string[]>
} {
  const pairs: { name: string; value: string }[] = []
  const map: Record<string, string | string[]> = Object.create(null)
  if (!raw || !String(raw).trim()) return { pairs, map }
  for (const part of String(raw).split(';')) {
    const s = part.trim()
    if (!s) continue
    const eq = s.indexOf('=')
    let name: string
    let value: string
    if (eq < 0) {
      name = s
      value = ''
    } else {
      name = s.slice(0, eq).trim()
      value = s.slice(eq + 1).trim()
    }
    if (!name) continue
    pairs.push({ name, value })
    if (map[name] === undefined) map[name] = value
    else if (Array.isArray(map[name])) (map[name] as string[]).push(value)
    else map[name] = [map[name] as string, value]
  }
  return { pairs, map }
}

export function parseSetCookie(line: string): {
  name: string
  value: string
  attributes: Record<string, string | boolean>
  flags: string[]
  warnings: string[]
} {
  const result = {
    name: '',
    value: '',
    attributes: {} as Record<string, string | boolean>,
    flags: [] as string[],
    warnings: [] as string[],
  }
  if (!line || !String(line).trim()) {
    result.warnings.push('空 Set-Cookie')
    return result
  }
  const parts = String(line).split(';')
  const first = parts[0]!.trim()
  const eq = first.indexOf('=')
  if (eq < 0) {
    result.name = first
    result.value = ''
    result.warnings.push('缺少 name=value')
  } else {
    result.name = first.slice(0, eq).trim()
    result.value = first.slice(eq + 1).trim()
  }
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i]!.trim()
    if (!p) continue
    const e = p.indexOf('=')
    if (e < 0) {
      result.flags.push(p)
      result.attributes[p.toLowerCase()] = true
    } else {
      const k = p.slice(0, e).trim()
      const v = p.slice(e + 1).trim()
      result.attributes[k.toLowerCase()] = v
    }
  }
  return result
}

export function parseSetCookieMulti(text: string) {
  if (!text || !String(text).trim()) return []
  return String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map(parseSetCookie)
}

export type SetCookieOpts = {
  name?: string
  value?: string
  path?: string
  domain?: string
  maxAge?: string | number
  expires?: string
  sameSite?: string
  secure?: boolean
  httpOnly?: boolean
  partitioned?: boolean
}

export function buildSetCookie(opts: SetCookieOpts = {}): string {
  const name = (opts.name || '').trim()
  if (!name) throw new Error('Cookie 名称不能为空')
  const value = opts.value != null ? String(opts.value) : ''
  const parts = [`${name}=${value}`]
  if (opts.path) parts.push('Path=' + opts.path)
  if (opts.domain) parts.push('Domain=' + opts.domain)
  if (opts.maxAge !== '' && opts.maxAge != null) parts.push('Max-Age=' + opts.maxAge)
  if (opts.expires) parts.push('Expires=' + opts.expires)
  if (opts.sameSite) parts.push('SameSite=' + opts.sameSite)
  if (opts.secure) parts.push('Secure')
  if (opts.httpOnly) parts.push('HttpOnly')
  if (opts.partitioned) parts.push('Partitioned')
  return parts.join('; ')
}

export type CacheControlOpts = {
  noStore?: boolean
  noCache?: boolean
  private?: boolean
  public?: boolean
  mustRevalidate?: boolean
  immutable?: boolean
  noTransform?: boolean
  maxAge?: string | number
  sMaxAge?: string | number
  staleWhileRevalidate?: string | number
  staleIfError?: string | number
}

export function buildCacheControl(opts: CacheControlOpts = {}): { header: string; notes: string[] } {
  const dirs: string[] = []
  const notes: string[] = []
  if (opts.noStore) {
    dirs.push('no-store')
    notes.push('no-store：禁止任何缓存（含浏览器与中间代理）')
    return { header: dirs.join(', '), notes }
  }
  if (opts.noCache) {
    dirs.push('no-cache')
    notes.push('no-cache：可存储但使用前须重新验证')
  }
  if (opts.private) {
    dirs.push('private')
    notes.push('private：仅浏览器私有缓存')
  } else if (opts.public) {
    dirs.push('public')
    notes.push('public：允许共享缓存（CDN）')
  }
  if (opts.mustRevalidate) dirs.push('must-revalidate')
  if (opts.immutable) {
    dirs.push('immutable')
    notes.push('immutable：内容在 max-age 内不会变，减少条件请求')
  }
  if (opts.noTransform) dirs.push('no-transform')
  if (opts.maxAge !== '' && opts.maxAge != null) dirs.push('max-age=' + opts.maxAge)
  if (opts.sMaxAge !== '' && opts.sMaxAge != null) {
    dirs.push('s-maxage=' + opts.sMaxAge)
    notes.push('s-maxage：仅共享缓存使用，覆盖 max-age')
  }
  if (opts.staleWhileRevalidate !== '' && opts.staleWhileRevalidate != null) {
    dirs.push('stale-while-revalidate=' + opts.staleWhileRevalidate)
  }
  if (opts.staleIfError !== '' && opts.staleIfError != null) {
    dirs.push('stale-if-error=' + opts.staleIfError)
  }
  if (!dirs.length) notes.push('未选择任何指令，将输出空字符串')
  return { header: dirs.join(', '), notes }
}

export function formatCookieParse(input: string): string {
  const text = String(input || '').trim()
  if (!text) throw new Error('请输入 Cookie 或 Set-Cookie')
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const looksSet =
    lines.length > 1 || /;\s*(Path|Domain|Expires|Max-Age|HttpOnly|Secure|SameSite)/i.test(text)
  if (looksSet) {
    const blocks = lines.map((line, i) => {
      const r = parseSetCookie(line)
      const attrs = Object.entries(r.attributes)
        .map(([k, v]) => `  ${k}=${v === true ? 'true' : v}`)
        .join('\n')
      return [
        `--- Set-Cookie #${i + 1} ---`,
        `name: ${r.name}`,
        `value: ${r.value}`,
        attrs ? `attributes:\n${attrs}` : 'attributes: (none)',
        r.warnings.length ? `warnings: ${r.warnings.join('; ')}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    })
    return blocks.join('\n\n')
  }
  const { pairs, map } = parseCookieHeader(text)
  if (!pairs.length) return '无 Cookie 对'
  return [
    '=== Cookie Header ===',
    `共 ${pairs.length} 项`,
    ...pairs.map((p, i) => `${i + 1}. ${p.name} = ${p.value}`),
    '',
    'JSON map:',
    JSON.stringify(map, null, 2),
  ].join('\n')
}
