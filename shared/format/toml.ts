/** 极简 TOML：仅支持顶层 key = value（字符串/数字/布尔） */

/** 检测是否含 [table] / [[array of tables]] 等表头语法 */
export function tomlHasTableHeader(src: string): boolean {
  for (const line of String(src || '').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    // 标准表头：[table] / [a.b] / [[array]]
    if (/^\[+[^\]]+\]+/.test(t)) return true
  }
  return false
}

function assertNoTable(src: string): void {
  if (tomlHasTableHeader(src)) {
    throw new Error(
      '当前仅支持顶层 key=value，不支持 [table] / [[array]] 表头语法。请去掉表头，或改用完整 TOML 工具。',
    )
  }
}

export function tomlParseLite(src: string): Record<string, unknown> {
  assertNoTable(src)
  const out: Record<string, unknown> = {}
  for (const line of String(src || '').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const m = t.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/)
    if (!m) continue
    out[m[1]!] = parseVal(m[2]!.trim())
  }
  return out
}

function parseVal(v: string): unknown {
  if (v === 'true') return true
  if (v === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v)
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
    return v.slice(1, -1)
  return v
}

export function tomlStringifyLite(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(([k, v]) => {
      if (typeof v === 'string') return k + ' = "' + v.replace(/"/g, '\\"') + '"'
      if (typeof v === 'boolean' || typeof v === 'number') return k + ' = ' + v
      return k + ' = "' + String(v) + '"'
    })
    .join('\n')
}

export function tomlFormat(src: string): string {
  return tomlStringifyLite(tomlParseLite(src))
}

export const TOML_SAMPLE = [
  '# 顶层 key=value 示例',
  'name = "demo"',
  'port = 8080',
  'enabled = true',
].join('\n')
