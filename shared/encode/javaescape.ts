/** Java 字符串转义 / 反转义 */

export function javaEscape(raw: string): string {
  let r = raw
  r = r.replace(/\\/g, '\\\\')
  r = r.replace(/\t/g, '\\t')
  r = r.replace(/\n/g, '\\n')
  r = r.replace(/\r/g, '\\r')
  r = r.replace(/\f/g, '\\f')
  // 真正的退格字符 U+0008，勿用 /\b/（词边界）
  r = r.replace(/\u0008/g, '\\b')
  r = r.replace(/"/g, '\\"')
  r = r.replace(/'/g, "\\'")
  return r
}

/** 单次扫描反转义，避免顺序导致的二次替换问题 */
export function javaUnescape(raw: string): string {
  let r = ''
  let i = 0
  while (i < raw.length) {
    if (raw[i] === '\\' && i + 1 < raw.length) {
      const next = raw[i + 1]
      if (next === 'u' && i + 5 < raw.length) {
        const hex = raw.slice(i + 2, i + 6)
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          r += String.fromCharCode(parseInt(hex, 16))
          i += 6
          continue
        }
      }
      const map: Record<string, string> = {
        t: '\t',
        n: '\n',
        r: '\r',
        f: '\f',
        b: '\b',
        '"': '"',
        "'": "'",
        '\\': '\\',
      }
      if (next in map) {
        r += map[next]
        i += 2
        continue
      }
    }
    r += raw[i]
    i++
  }
  return r
}
