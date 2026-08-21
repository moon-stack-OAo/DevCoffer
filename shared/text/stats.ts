/** 文本统计 */

export type TextStats = {
  chars: number
  charsNoSpace: number
  words: number
  lines: number
  bytes: number
  cjk: number
}

export function calcStats(text: string): TextStats {
  const s = text ?? ''
  let bytes = 0
  if (typeof TextEncoder !== 'undefined') {
    bytes = new TextEncoder().encode(s).length
  } else {
    bytes = Buffer.byteLength(s, 'utf8')
  }
  const cjk = s.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g)
  return {
    chars: s.length,
    charsNoSpace: s.replace(/\s/g, '').length,
    words: s.trim() ? s.trim().split(/\s+/).length : 0,
    lines: s ? s.split('\n').length : 0,
    bytes,
    cjk: cjk ? cjk.length : 0,
  }
}

export function formatStatsReport(text: string): string {
  const st = calcStats(text)
  return [
    '字符数: ' + st.chars,
    '字符数(不含空白): ' + st.charsNoSpace,
    '词数: ' + st.words,
    '行数: ' + st.lines,
    '字节(UTF-8): ' + st.bytes,
    'CJK 字符: ' + st.cjk,
  ].join('\n')
}
