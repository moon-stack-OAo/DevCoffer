/** JSON 数组 → 简单 INSERT */

export function jsonToInsert(jsonText: string, table = 't_data'): string {
  const raw = String(jsonText || '').trim()
  if (!raw) throw new Error('请输入 JSON 数组或对象')
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error('JSON 解析失败')
  }
  const rows = Array.isArray(data) ? data : [data]
  if (!rows.length) throw new Error('空数组')
  if (rows.some((r) => r == null || typeof r !== 'object' || Array.isArray(r))) {
    throw new Error('需要对象数组')
  }
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r as object)))]
  if (!keys.length) throw new Error('无字段')
  const tbl = String(table || 't_data').replace(/[^\w]/g, '_')
  const cols = keys.map((k) => '`' + k.replace(/`/g, '') + '`').join(', ')
  const stmts = rows.map((row) => {
    const obj = row as Record<string, unknown>
    const vals = keys
      .map((k) => sqlLiteral(obj[k]))
      .join(', ')
    return `INSERT INTO \`${tbl}\` (${cols}) VALUES (${vals});`
  })
  return stmts.join('\n')
}

function sqlLiteral(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number' && isFinite(v)) return String(v)
  if (typeof v === 'boolean') return v ? '1' : '0'
  if (typeof v === 'object') return "'" + JSON.stringify(v).replace(/'/g, "''") + "'"
  return "'" + String(v).replace(/'/g, "''") + "'"
}
