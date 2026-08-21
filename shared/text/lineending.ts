/** 行尾 / BOM / 不可见字符 */

const LE_BOM = '\uFEFF'

const LE_INVISIBLE_MAP: Record<string, string> = {
  '\u200B': 'ZWSP',
  '\u200C': 'ZWNJ',
  '\u200D': 'ZWJ',
  '\uFEFF': 'BOM',
  '\u00A0': 'NBSP',
  '\u200E': 'LRM',
  '\u200F': 'RLM',
  '\u202A': 'LRE',
  '\u202B': 'RLE',
  '\u202C': 'PDF',
  '\u202D': 'LRO',
  '\u202E': 'RLO',
  '\u2060': 'WJ',
  '\u00AD': 'SHY',
  '\u3000': 'IDSP',
  '\t': 'TAB',
  '\v': 'VT',
  '\f': 'FF',
}

const LE_INVISIBLE_RE = new RegExp(
  '[' +
    Object.keys(LE_INVISIBLE_MAP)
      .map((ch) => ch.replace(/[\\^\-\]]/g, '\\$&'))
      .join('') +
    ']',
  'g',
)

export function detectLineEndings(text: string) {
  const s = String(text ?? '')
  let crlf = 0
  let lf = 0
  let cr = 0
  let i = 0
  while (i < s.length) {
    const c = s.charAt(i)
    if (c === '\r') {
      if (i + 1 < s.length && s.charAt(i + 1) === '\n') {
        crlf++
        i += 2
      } else {
        cr++
        i++
      }
    } else if (c === '\n') {
      lf++
      i++
    } else {
      i++
    }
  }
  const kinds = (crlf > 0 ? 1 : 0) + (lf > 0 ? 1 : 0) + (cr > 0 ? 1 : 0)
  let dominant = 'none'
  if (crlf >= lf && crlf >= cr && crlf > 0) dominant = 'CRLF'
  else if (lf >= crlf && lf >= cr && lf > 0) dominant = 'LF'
  else if (cr > 0) dominant = 'CR'
  const totalEnds = crlf + lf + cr
  return {
    crlf,
    lf,
    cr,
    mixed: kinds > 1,
    dominant,
    totalLines: totalEnds + (s.length === 0 ? 0 : 1),
    totalEnds,
  }
}

export function convertLineEndings(text: string, target: string): string {
  let s = String(text ?? '')
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const t = String(target || 'LF').toUpperCase()
  if (t === 'CRLF' || t === '\r\n') return s.replace(/\n/g, '\r\n')
  if (t === 'CR' || t === '\r') return s.replace(/\n/g, '\r')
  return s
}

export function stripBom(text: string): string {
  const s = String(text ?? '')
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s
}

export function addBom(text: string): string {
  const s = String(text ?? '')
  if (s.charCodeAt(0) === 0xfeff) return s
  return LE_BOM + s
}

export function hasBom(text: string): boolean {
  if (text == null || text === '') return false
  return String(text).charCodeAt(0) === 0xfeff
}

export function findInvisibleChars(text: string) {
  const s = String(text ?? '')
  const items: Array<{ char: string; label: string; index: number; code: string }> = []
  for (let i = 0; i < s.length; i++) {
    const ch = s.charAt(i)
    if (LE_INVISIBLE_MAP[ch]) {
      items.push({
        char: ch,
        label: LE_INVISIBLE_MAP[ch]!,
        index: i,
        code: 'U+' + ('0000' + ch.charCodeAt(0).toString(16).toUpperCase()).slice(-4),
      })
    }
  }
  return { count: items.length, items }
}

export function stripInvisibleChars(
  text: string,
  options: { keepTab?: boolean; keepNbsp?: boolean } = {},
): string {
  const keepTab = !!options.keepTab
  const keepNbsp = !!options.keepNbsp
  return String(text ?? '').replace(LE_INVISIBLE_RE, (ch) => {
    if (keepTab && ch === '\t') return ch
    if (keepNbsp && ch === '\u00A0') return ch
    return ''
  })
}

export function visualizeInvisibleChars(
  text: string,
  options: { showNewline?: boolean } = {},
): string {
  let s = String(text ?? '').replace(LE_INVISIBLE_RE, (ch) => {
    return '⟦' + (LE_INVISIBLE_MAP[ch] || 'INV') + '⟧'
  })
  if (options.showNewline) {
    s = s.replace(/\r\n/g, '⟦CRLF⟧\n').replace(/\r/g, '⟦CR⟧\n').replace(/\n/g, '⟦LF⟧\n')
  }
  return s
}

export function lineendingReport(text: string): string {
  const s = String(text ?? '')
  const le = detectLineEndings(s)
  const inv = findInvisibleChars(s)
  const bom = hasBom(s)
  const lines = [
    '=== 行尾 / BOM / 不可见字符 ===',
    '文本长度: ' + s.length + ' 字符',
    'UTF-8 BOM: ' + (bom ? '有 (U+FEFF)' : '无'),
    '',
    '--- 行尾 ---',
    'CRLF (\\r\\n): ' + le.crlf,
    'LF   (\\n)  : ' + le.lf,
    'CR   (\\r)  : ' + le.cr,
    '混用: ' + (le.mixed ? '是' : '否'),
    '主导: ' + le.dominant,
    '',
    '--- 不可见字符 ---',
    '合计: ' + inv.count,
  ]
  if (inv.count > 0) {
    const byLabel: Record<string, number> = Object.create(null)
    inv.items.forEach((it) => {
      byLabel[it.label] = (byLabel[it.label] || 0) + 1
    })
    Object.keys(byLabel)
      .sort()
      .forEach((k) => lines.push('  ' + k + ': ' + byLabel[k]))
  }
  return lines.join('\n')
}
