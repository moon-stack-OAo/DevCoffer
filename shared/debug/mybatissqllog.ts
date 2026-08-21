/** 从 MyBatis / 控制台日志提取 Preparing / Parameters 并尝试拼 SQL */

export function extractMybatisSql(log: string): string {
  const text = String(log || '')
  if (!text.trim()) throw new Error('请粘贴含 Preparing: / Parameters: 的日志')
  const prep = [...text.matchAll(/Preparing:\s*(.+)/gi)].map((m) => m[1]!.trim())
  const params = [...text.matchAll(/Parameters:\s*(.*)/gi)].map((m) => m[1]!.trim())
  if (!prep.length) {
    // 兜底：找较长 SQL 行
    const sqlish = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => /^(select|insert|update|delete|with)\b/i.test(l))
    if (!sqlish.length) throw new Error('未找到 Preparing: 或 SQL 语句')
    return sqlish.join('\n\n')
  }
  const out: string[] = []
  for (let i = 0; i < prep.length; i++) {
    const sql = prep[i]!
    const p = params[i] || ''
    out.push(`--- SQL #${i + 1} ---`, sql)
    if (p) {
      out.push(`Parameters: ${p}`)
      out.push('Bound(简化):', bindMybatis(sql, p))
    }
    out.push('')
  }
  return out.join('\n').trimEnd()
}

/** Parameters 形如: 1(Integer), foo(String), null */
function bindMybatis(sql: string, paramLine: string): string {
  const parts = paramLine.split(',').map((s) => s.trim()).filter(Boolean)
  const values: string[] = []
  for (const part of parts) {
    if (/^null$/i.test(part)) {
      values.push('NULL')
      continue
    }
    const m = part.match(/^(.*)\(([^)]+)\)\s*$/)
    if (!m) {
      values.push(part)
      continue
    }
    const raw = m[1]!.trim()
    const typ = m[2]!.toLowerCase()
    if (typ.includes('str') || typ.includes('date') || typ.includes('time') || typ === 'character') {
      values.push("'" + raw.replace(/'/g, "''") + "'")
    } else {
      values.push(raw === '' ? 'NULL' : raw)
    }
  }
  let i = 0
  return sql.replace(/\?/g, () => (i < values.length ? values[i++]! : '?'))
}
