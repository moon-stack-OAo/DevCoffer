/** Markdown 表格对齐 / CSV↔MD */

function parseCsvLine(line: string): string[] {
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
    else if (ch === ',') {
      result.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  result.push(cur.trim())
  return result
}

export function parseTableRows(text: string, delimiter: string = 'auto'): string[][] {
  if (text == null || String(text).trim() === '') throw new Error('请输入表格数据')
  const lines = String(text)
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== '')
  if (!lines.length) throw new Error('无有效行')

  let delim = delimiter
  if (!delim || delim === 'auto') {
    const sample = lines[0]!
    if (sample.includes('\t')) delim = '\t'
    else if (/^\s*\|/.test(sample) || sample.includes('|')) delim = '|'
    else delim = ','
  }
  if (delim === '\\t') delim = '\t'

  return lines.map((line) => {
    if (delim === '|') {
      let s = line.trim()
      if (s.startsWith('|')) s = s.slice(1)
      if (s.endsWith('|')) s = s.slice(0, -1)
      return s.split('|').map((c) => c.trim())
    }
    if (delim === ',') return parseCsvLine(line)
    return line.split(delim).map((c) => c.trim())
  })
}

function escapeCell(s: string): string {
  return String(s ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>')
}

function alignSep(a: string): string {
  if (a === 'center') return ':---:'
  if (a === 'right') return '---:'
  return ':---'
}

export function toMdTable(
  text: string,
  options: { delimiter?: string; align?: string; header?: boolean } = {},
): string {
  let rows = parseTableRows(text, options.delimiter || 'auto')
  rows = rows.filter((r) => !r.every((c) => /^:?-+:?$/.test(String(c).trim())))
  if (!rows.length) throw new Error('无有效数据行')

  const colCount = Math.max(...rows.map((r) => r.length))
  rows = rows.map((r) => {
    const copy = r.slice()
    while (copy.length < colCount) copy.push('')
    return copy
  })

  const header = options.header !== false
  const alignList = Array.from({ length: colCount }, () => options.align || 'left')
  const lines: string[] = []

  if (header) {
    lines.push('| ' + rows[0]!.map(escapeCell).join(' | ') + ' |')
    lines.push('| ' + alignList.map((a) => alignSep(a)).join(' | ') + ' |')
    for (let i = 1; i < rows.length; i++) {
      lines.push('| ' + rows[i]!.map(escapeCell).join(' | ') + ' |')
    }
  } else {
    const empty = Array.from({ length: colCount }, (_, i) => '列' + (i + 1))
    lines.push('| ' + empty.join(' | ') + ' |')
    lines.push('| ' + alignList.map((a) => alignSep(a)).join(' | ') + ' |')
    rows.forEach((r) => lines.push('| ' + r.map(escapeCell).join(' | ') + ' |'))
  }
  return lines.join('\n')
}

export function beautifyMdTable(text: string): string {
  return toMdTable(text, { delimiter: '|', header: true })
}

export function mdTableToCsv(text: string, delim = ','): string {
  let rows = parseTableRows(text, '|')
  rows = rows.filter((r) => !r.every((c) => /^:?-+:?$/.test(String(c).trim())))
  return rows
    .map((r) =>
      r
        .map((c) => {
          const need = /[",\n]/.test(c)
          return need ? '"' + c.replace(/"/g, '""') + '"' : c
        })
        .join(delim),
    )
    .join('\n')
}
