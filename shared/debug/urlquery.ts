/** URL query 编解码 / 构造 */

export type UrlQueryParam = { k: string; v: string }

export function urlQueryParse(url: string): {
  ok: boolean
  base?: string
  params?: UrlQueryParam[]
  hash?: string
  msg?: string
} {
  const raw = url == null ? '' : String(url).trim()
  if (!raw) return { ok: false, msg: '请输入 URL' }

  let hash = ''
  let withoutHash = raw
  const hashIdx = raw.indexOf('#')
  if (hashIdx !== -1) {
    hash = raw.slice(hashIdx + 1)
    withoutHash = raw.slice(0, hashIdx)
  }

  let query = ''
  let base = withoutHash
  const qIdx = withoutHash.indexOf('?')
  if (qIdx !== -1) {
    base = withoutHash.slice(0, qIdx)
    query = withoutHash.slice(qIdx + 1)
  }

  const params: UrlQueryParam[] = []
  if (query) {
    for (const pair of query.split('&')) {
      if (!pair) continue
      const eq = pair.indexOf('=')
      let k = eq === -1 ? pair : pair.slice(0, eq)
      let v = eq === -1 ? '' : pair.slice(eq + 1)
      try {
        k = decodeURIComponent(k.replace(/\+/g, ' '))
      } catch {
        /* keep */
      }
      try {
        v = decodeURIComponent(v.replace(/\+/g, ' '))
      } catch {
        /* keep */
      }
      params.push({ k, v })
    }
  }
  return { ok: true, base, params, hash }
}

export function urlQueryParseParamsText(text: string): UrlQueryParam[] {
  const lines = String(text || '').split(/\r?\n/)
  const params: UrlQueryParam[] = []
  for (const line0 of lines) {
    const line = line0.trim()
    if (!line || line.charAt(0) === '#') continue
    const eq = line.indexOf('=')
    if (eq === -1) params.push({ k: line, v: '' })
    else params.push({ k: line.slice(0, eq).trim(), v: line.slice(eq + 1) })
  }
  return params
}

export function urlQueryParamsToText(params: UrlQueryParam[]): string {
  if (!params?.length) return ''
  return params.map((p) => (p.k || '') + '=' + (p.v == null ? '' : p.v)).join('\n')
}

export function urlQueryBuild(
  base: string,
  params: UrlQueryParam[] | string,
  hash?: string,
): { ok: boolean; url?: string; msg?: string } {
  let b = base == null ? '' : String(base).trim()
  if (!b) return { ok: false, msg: '请输入 Base URL' }

  const list = typeof params === 'string' ? urlQueryParseParamsText(params) : params || []
  const hashIdx = b.indexOf('#')
  if (hashIdx !== -1) b = b.slice(0, hashIdx)
  const qIdx = b.indexOf('?')
  if (qIdx !== -1) b = b.slice(0, qIdx)

  const qs: string[] = []
  for (const p of list) {
    const k = p?.k != null ? String(p.k).trim() : ''
    if (!k) continue
    const v = p?.v != null ? String(p.v) : ''
    qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v))
  }

  let url = b
  if (qs.length) url += '?' + qs.join('&')
  let h = hash == null ? '' : String(hash).trim()
  if (h) {
    if (h.charAt(0) === '#') h = h.slice(1)
    url += '#' + h
  }
  return { ok: true, url }
}
