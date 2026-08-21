/** CSV 解析 / 转 JSON / 转 HTML table / 对齐 */

export function parseCsvLine(line: string, delim: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (inQuote) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"'
          i++
        } else inQuote = false
      } else cur += ch
    } else if (ch === '"') inQuote = true
    else if (ch === delim) {
      result.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  result.push(cur.trim())
  return result
}

export function parseCsv(text: string, delim = ','): string[][] {
  const d = delim === '\\t' ? '\t' : delim
  const lines = String(text ?? '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== '')
  return lines.map((l) => parseCsvLine(l, d))
}

export function csvToJson(text: string, delim = ',', hasHeader = true): string {
  const rows = parseCsv(text, delim)
  if (!rows.length) throw new Error('无数据')
  if (!hasHeader) {
    return JSON.stringify(rows, null, 2)
  }
  const header = rows[0]!
  const data = rows.slice(1).map((r) => {
    const o: Record<string, string> = {}
    header.forEach((h, i) => {
      o[h || 'col' + (i + 1)] = r[i] ?? ''
    })
    return o
  })
  return JSON.stringify(data, null, 2)
}

export function csvToHtmlTable(text: string, delim = ',', hasHeader = true): string {
  const rows = parseCsv(text, delim)
  if (!rows.length) throw new Error('无数据')
  const escape = (s: string) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  let html = '<table>\n'
  rows.forEach((row, i) => {
    const tag = hasHeader && i === 0 ? 'th' : 'td'
    html += '  <tr>' + row.map((c) => `<${tag}>${escape(c)}</${tag}>`).join('') + '</tr>\n'
  })
  html += '</table>'
  return html
}

export function formatCsvAlign(text: string, delim = ','): string {
  const d = delim === '\\t' ? '\t' : delim
  const rows = parseCsv(text, delim)
  if (!rows.length) throw new Error('无数据')
  const maxCols = Math.max(...rows.map((r) => r.length))
  const padded = rows.map((r) => {
    const copy = r.slice()
    while (copy.length < maxCols) copy.push('')
    return copy
  })
  const widths = Array.from({ length: maxCols }, (_, c) =>
    Math.max(1, ...padded.map((r) => (r[c] ?? '').length)),
  )
  return padded
    .map((row) =>
      row
        .map((cell, j) => cell + ' '.repeat(Math.max(0, widths[j]! - cell.length)))
        .join(d === '\t' ? '\t' : d + ' '),
    )
    .join('\n')
}
