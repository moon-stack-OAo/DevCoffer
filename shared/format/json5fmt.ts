/** JSON5/JSONC 宽松解析 → 标准 JSON（去注释/尾逗号/单引号/无引号 key） */

function stripJsonc(text: string): string {
  const s = String(text ?? '')
  let out = ''
  let i = 0
  const n = s.length
  let inStr = false
  let quote = ''
  let escape = false
  while (i < n) {
    const ch = s[i]!
    const next = i + 1 < n ? s[i + 1]! : ''
    if (inStr) {
      out += ch
      if (escape) escape = false
      else if (ch === '\\') escape = true
      else if (ch === quote) {
        inStr = false
        quote = ''
      }
      i++
      continue
    }
    if (ch === '"' || ch === "'") {
      inStr = true
      quote = ch
      out += ch
      i++
      continue
    }
    if (ch === '/' && next === '/') {
      i += 2
      while (i < n && s[i] !== '\n' && s[i] !== '\r') i++
      continue
    }
    if (ch === '/' && next === '*') {
      i += 2
      while (i < n - 1 && !(s[i] === '*' && s[i + 1] === '/')) i++
      i = Math.min(n, i + 2)
      out += ' '
      continue
    }
    out += ch
    i++
  }
  return out
}

function stripTrailingCommas(text: string): string {
  let s = String(text)
  let prev = ''
  do {
    prev = s
    s = s.replace(/,(\s*[}\]])/g, '$1')
  } while (s !== prev)
  return s
}

function singleToDouble(text: string): string {
  const s = String(text)
  let out = ''
  let i = 0
  const n = s.length
  let inDouble = false
  let escape = false
  while (i < n) {
    const ch = s[i]!
    if (inDouble) {
      out += ch
      if (escape) escape = false
      else if (ch === '\\') escape = true
      else if (ch === '"') inDouble = false
      i++
      continue
    }
    if (ch === '"') {
      inDouble = true
      out += ch
      i++
      continue
    }
    if (ch === "'") {
      out += '"'
      i++
      while (i < n) {
        const c = s[i]!
        if (c === '\\' && i + 1 < n) {
          const nx = s[i + 1]!
          if (nx === "'") {
            out += "'"
            i += 2
            continue
          }
          out += c + nx
          i += 2
          continue
        }
        if (c === "'") {
          out += '"'
          i++
          break
        }
        if (c === '"') {
          out += '\\"'
          i++
          continue
        }
        out += c
        i++
      }
      continue
    }
    out += ch
    i++
  }
  return out
}

function quoteKeys(text: string): string {
  return String(text).replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
}

export function parseJson5ish(text: string): unknown {
  if (text == null || !String(text).trim()) throw new Error('内容为空')
  let s = stripJsonc(text)
  s = stripTrailingCommas(s)
  s = singleToDouble(s)
  s = quoteKeys(s)
  try {
    return JSON.parse(s)
  } catch (e) {
    throw new Error('解析失败: ' + (e instanceof Error ? e.message : String(e)))
  }
}

export function formatJson5(text: string, indent: number | string = 2): string {
  const value = parseJson5ish(text)
  return JSON.stringify(value, null, indent as number)
}

export function toStrictJson(text: string, pretty = true, indent = 2): string {
  const value = parseJson5ish(text)
  return pretty ? JSON.stringify(value, null, indent) : JSON.stringify(value)
}
