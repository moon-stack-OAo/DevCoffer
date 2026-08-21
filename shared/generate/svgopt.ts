export type SvgoptOpts = {
  stripComments?: boolean
  collapseWhitespace?: boolean
  stripInkscape?: boolean
  stripXmlSpace?: boolean
  stripWidthHeight?: boolean
  trimDecimals?: number | null
}

export type SvgoptResult = {
  ok: boolean
  msg?: string
  before: number
  after: number
  svg: string
}

export function svgoptByteLen(s: string | null | undefined): number {
  if (s == null) return 0
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(String(s)).length
  }
  try {
    return unescape(encodeURIComponent(String(s))).length
  } catch {
    return String(s).length
  }
}

export function svgoptDefaultOpts(opts?: SvgoptOpts) {
  const o = opts || {}
  return {
    stripComments: o.stripComments !== false,
    collapseWhitespace: o.collapseWhitespace !== false,
    stripInkscape: o.stripInkscape !== false,
    stripXmlSpace: o.stripXmlSpace !== false,
    stripWidthHeight: !!o.stripWidthHeight,
    trimDecimals:
      o.trimDecimals != null && isFinite(Number(o.trimDecimals))
        ? Number(o.trimDecimals)
        : null,
  }
}

function svgoptCollapseWs(svg: string): string {
  let s = String(svg)
  s = s.replace(/>\s+</g, '><')
  s = s.replace(/[ \t\f\v]+/g, ' ')
  s = s.replace(/\n+/g, '\n')
  s = s.replace(/\s*\n\s*/g, '\n')
  return s.trim()
}

function svgoptStripComments(svg: string): string {
  return String(svg).replace(/<!--[\s\S]*?-->/g, '')
}

function svgoptStripAttrs(svg: string, opts: ReturnType<typeof svgoptDefaultOpts>): string {
  let s = String(svg)
  if (opts.stripInkscape) {
    s = s.replace(
      /\s+(?:inkscape|sodipodi|xmlns:(?:inkscape|sodipodi)|i:|sodipodi:)[a-zA-Z0-9_.:-]*=(?:"[^"]*"|'[^']*')/g,
      '',
    )
    s = s.replace(/\s+xmlns:inkscape=(?:"[^"]*"|'[^']*')/g, '')
    s = s.replace(/\s+xmlns:sodipodi=(?:"[^"]*"|'[^']*')/g, '')
  }
  if (opts.stripXmlSpace) {
    s = s.replace(/\s+xml:space=(?:"[^"]*"|'[^']*')/g, '')
  }
  if (opts.stripWidthHeight) {
    s = s.replace(/<svg\b([^>]*)>/i, (_m, attrs: string) => {
      let a = attrs
      a = a.replace(/\s+width=(?:"[^"]*"|'[^']*')/i, '')
      a = a.replace(/\s+height=(?:"[^"]*"|'[^']*')/i, '')
      return '<svg' + a + '>'
    })
  }
  return s
}

function svgoptTrimNumberDecimals(svg: string, digits: number): string {
  if (digits == null || !isFinite(digits) || digits < 0) return String(svg)
  const d = Math.min(8, Math.floor(digits))
  return String(svg).replace(/(-?\d+\.\d+)/g, (m) => {
    const n = Number(m)
    if (!isFinite(n)) return m
    let t = n.toFixed(d)
    t = t.replace(/\.?0+$/, '')
    return t === '-0' ? '0' : t
  })
}

export function svgoptOptimize(svg: string, opts?: SvgoptOpts): SvgoptResult {
  const raw = svg == null ? '' : String(svg)
  if (!raw.trim()) {
    return { ok: false, msg: '请粘贴 SVG 源码', before: 0, after: 0, svg: '' }
  }
  if (!/<svg[\s>]/i.test(raw)) {
    return {
      ok: false,
      msg: '未检测到 <svg> 根元素',
      before: svgoptByteLen(raw),
      after: 0,
      svg: '',
    }
  }
  const o = svgoptDefaultOpts(opts)
  let out = raw
  if (o.stripComments) out = svgoptStripComments(out)
  out = svgoptStripAttrs(out, o)
  if (o.trimDecimals != null) out = svgoptTrimNumberDecimals(out, o.trimDecimals)
  if (o.collapseWhitespace) out = svgoptCollapseWs(out)
  else out = out.trim()
  const before = svgoptByteLen(raw)
  const after = svgoptByteLen(out)
  return { ok: true, svg: out, before, after }
}

export function svgoptToDataUri(svg: string): string {
  const s = svg == null ? '' : String(svg).trim()
  if (!s) return ''
  const encoded = encodeURIComponent(s)
    .replace(/%20/g, ' ')
    .replace(/%3D/g, '=')
    .replace(/%3A/g, ':')
    .replace(/%2F/g, '/')
    .replace(/%22/g, "'")
  return 'data:image/svg+xml,' + encoded
}

export function svgoptFmtSize(n: number): string {
  if (n < 1024) return n + ' B'
  return (n / 1024).toFixed(2) + ' KB'
}

export function svgOptimizeLite(svg: string): string {
  const r = svgoptOptimize(svg)
  if (!r.ok) throw new Error(r.msg || '优化失败')
  return r.svg
}

export const SVGOPT_EXAMPLE =
  '<?xml version="1.0"?>\n' +
  '<!-- sample -->\n' +
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"\n' +
  '  xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"\n' +
  '  inkscape:version="1.0" xml:space="preserve">\n' +
  '  <circle cx="50" cy="50" r="40" fill="#6366f1" />\n' +
  '</svg>\n'
