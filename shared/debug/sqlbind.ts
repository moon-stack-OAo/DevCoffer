/** MyBatis ? / :name / #{name} 参数绑定展示 */

function isBareLiteral(val: string, forceString: boolean): boolean {
  if (forceString) return false
  const s = String(val).trim()
  if (/^null$/i.test(s)) return true
  if (/^(true|false)$/i.test(s)) return true
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(s)) return true
  return false
}

function toLiteral(raw: string, forceString: boolean): string {
  const s = raw == null ? '' : String(raw)
  if (
    !forceString &&
    ((s.charAt(0) === "'" && s.charAt(s.length - 1) === "'") ||
      (s.charAt(0) === '"' && s.charAt(s.length - 1) === '"'))
  ) {
    if (s.charAt(0) === '"') {
      return "'" + s.slice(1, -1).replace(/'/g, "''") + "'"
    }
    return s
  }
  if (isBareLiteral(s, forceString)) {
    if (/^null$/i.test(s.trim())) return 'NULL'
    return s.trim()
  }
  return "'" + s.replace(/'/g, "''") + "'"
}

export function parsePositional(paramsText: string): string[] {
  const text = String(paramsText || '').trim()
  if (!text) return []
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  if (lines.length > 1) return lines
  const single = lines[0] || text
  if (single.charAt(0) === '[' || single.charAt(0) === '{') {
    try {
      const parsed = JSON.parse(single)
      if (Array.isArray(parsed)) return parsed.map((v) => (v == null ? 'null' : String(v)))
      if (parsed && typeof parsed === 'object') {
        return Object.values(parsed as Record<string, unknown>).map((v) =>
          v == null ? 'null' : String(v),
        )
      }
    } catch {
      /* fallthrough */
    }
  }
  if (single.includes(',')) {
    return single.split(',').map((s) => s.trim())
  }
  return [single]
}

export function parseNamed(paramsText: string): Record<string, string> {
  const text = String(paramsText || '').trim()
  const map: Record<string, string> = {}
  if (!text) return map
  if (text.startsWith('{')) {
    try {
      const obj = JSON.parse(text) as Record<string, unknown>
      Object.keys(obj).forEach((k) => {
        map[k] = obj[k] == null ? 'null' : String(obj[k])
      })
      return map
    } catch {
      /* fallthrough */
    }
  }
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 0) continue
    map[t.slice(0, eq).trim()] = t.slice(eq + 1)
  }
  return map
}

export function bindSql(sql: string, paramsText: string, forceString = false): string {
  const sqlText = String(sql || '')
  if (!sqlText.trim()) throw new Error('请输入 SQL')

  // named :name or #{name} or ${name}
  if (/[:#]\{?\w+\}?/.test(sqlText) && !/\?/.test(sqlText)) {
    const named = parseNamed(paramsText)
    return sqlText.replace(/#\{(\w+)\}|\$\{(\w+)\}|:(\w+)/g, (_, a, b, c) => {
      const key = a || b || c
      if (!(key in named)) return _
      return toLiteral(named[key]!, forceString)
    })
  }

  const pos = parsePositional(paramsText)
  let i = 0
  return sqlText.replace(/\?/g, () => {
    if (i >= pos.length) return '?'
    return toLiteral(pos[i++]!, forceString)
  })
}
