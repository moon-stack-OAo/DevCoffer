/** 文本行处理：排序 / 去重 / 反转 / 打乱 */

export type SplitOpts = { trim?: boolean; removeEmpty?: boolean; separator?: string }

export function splitLines(text: string, opts: SplitOpts = {}): string[] {
  if (text == null) return []
  let s = String(text)
  let lines: string[]
  if (opts.separator != null && opts.separator !== '') {
    lines = s.split(opts.separator)
  } else {
    s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    lines = s.split('\n')
  }
  if (opts.trim) lines = lines.map((l) => String(l).trim())
  if (opts.removeEmpty) lines = lines.filter((l) => l !== '')
  return lines
}

export function joinLines(lines: string[], sep = '\n'): string {
  if (!lines || !lines.length) return ''
  return lines.join(sep)
}

export type SortOpts = {
  order?: 'asc' | 'desc'
  numeric?: boolean
  caseInsensitive?: boolean
}

export function sortLines(lines: string[], opts: SortOpts = {}): string[] {
  const order = opts.order === 'desc' ? 'desc' : 'asc'
  const arr = (lines || []).slice()
  const ci = !!opts.caseInsensitive
  const num = !!opts.numeric
  arr.sort((a, b) => {
    let x = a == null ? '' : String(a)
    let y = b == null ? '' : String(b)
    if (ci) {
      x = x.toLowerCase()
      y = y.toLowerCase()
    }
    let cmp: number
    if (num) {
      const nx = parseFloat(x)
      const ny = parseFloat(y)
      const xOk = !isNaN(nx) && isFinite(nx)
      const yOk = !isNaN(ny) && isFinite(ny)
      if (xOk && yOk) cmp = nx - ny
      else if (xOk) cmp = -1
      else if (yOk) cmp = 1
      else cmp = x < y ? -1 : x > y ? 1 : 0
    } else {
      cmp = x < y ? -1 : x > y ? 1 : 0
    }
    return order === 'desc' ? -cmp : cmp
  })
  return arr
}

export function uniqueLines(lines: string[], opts: { caseInsensitive?: boolean } = {}): string[] {
  const ci = !!opts.caseInsensitive
  const seen: Record<string, boolean> = Object.create(null)
  const out: string[] = []
  for (const item of lines || []) {
    const raw = item == null ? '' : String(item)
    const key = ci ? raw.toLowerCase() : raw
    if (seen[key]) continue
    seen[key] = true
    out.push(raw)
  }
  return out
}

export function reverseLines(lines: string[]): string[] {
  return (lines || []).slice().reverse()
}

export function shuffleLines(lines: string[]): string[] {
  const arr = (lines || []).slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = arr[i]!
    arr[i] = arr[j]!
    arr[j] = t
  }
  return arr
}

export function addLineNumbers(lines: string[], start = 1): string[] {
  return (lines || []).map((l, i) => String(start + i) + '\t' + l)
}

export function removeLineNumbers(lines: string[]): string[] {
  return (lines || []).map((l) => l.replace(/^\s*\d+[\t:.\s]+/, ''))
}

export type ProcessOpts = SplitOpts &
  SortOpts & {
    unique?: boolean
    sort?: boolean
    reverse?: boolean
    shuffle?: boolean
    joinWith?: string
    addNumbers?: boolean
    removeNumbers?: boolean
  }

export function processTextLines(text: string, options: ProcessOpts = {}): string {
  let lines = splitLines(text, {
    trim: !!options.trim,
    removeEmpty: !!options.removeEmpty,
    separator: options.separator,
  })
  if (options.removeNumbers) lines = removeLineNumbers(lines)
  if (options.unique) lines = uniqueLines(lines, { caseInsensitive: !!options.caseInsensitive })
  if (options.sort) {
    lines = sortLines(lines, {
      order: options.order || 'asc',
      numeric: !!options.numeric,
      caseInsensitive: !!options.caseInsensitive,
    })
  }
  if (options.reverse) lines = reverseLines(lines)
  if (options.shuffle) lines = shuffleLines(lines)
  if (options.addNumbers) lines = addLineNumbers(lines)
  return joinLines(lines, options.joinWith != null ? options.joinWith : '\n')
}
