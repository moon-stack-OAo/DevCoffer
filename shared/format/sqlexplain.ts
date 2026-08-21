const HINTS: [RegExp, string][] = [
  [/\bSELECT\s+\*/i, '避免 SELECT *，明确列以利于索引与传输'],
  [/\bWHERE\b[\s\S]*\bOR\b/i, 'OR 可能导致索引失效，考虑 UNION 或 IN'],
  [/\bLIKE\s+['"]%/i, '前导 % 的 LIKE 通常无法走 BTree 索引'],
  [/\bORDER BY\b/i, '确认 ORDER BY 列有索引或与 WHERE 组合覆盖'],
  [/\bJOIN\b/i, '检查 JOIN 条件类型一致且有索引'],
  [/\bGROUP BY\b/i, 'GROUP BY 列尽量有索引；注意 ONLY_FULL_GROUP_BY'],
  [/\bDISTINCT\b/i, 'DISTINCT 可能引发排序/临时表，确认必要性'],
  [/\bIN\s*\([^)]{200,}\)/i, '超长 IN 列表考虑临时表或 EXISTS'],
]

/** 基础 SQL 形态：至少含常见 DML/查询关键字 */
const SQL_SHAPE_RE =
  /\b(SELECT|INSERT|UPDATE|DELETE|WITH|REPLACE|MERGE|CREATE|ALTER|DROP|TRUNCATE|EXPLAIN|SHOW|DESCRIBE|DESC)\b/i

export function sqlExplainHints(sql: string): string {
  const s = String(sql || '').trim()
  if (!s) throw new Error('请输入 SQL')
  if (!SQL_SHAPE_RE.test(s)) {
    throw new Error('请输入有效 SQL（需包含 SELECT / INSERT / UPDATE / DELETE / WITH 等关键字）')
  }

  const hits = HINTS.filter(([re]) => re.test(s)).map(([, h], i) => i + 1 + '. ' + h)
  const kw = Array.from(
    new Set(
      s
        .toUpperCase()
        .match(/\b(SELECT|FROM|WHERE|JOIN|GROUP|ORDER|LIMIT|INSERT|UPDATE|DELETE|WITH)\b/g) || [],
    ),
  )
  return [
    '关键字: ' + (kw.join(', ') || '(无)'),
    '',
    '启发式说明（非真实 EXPLAIN）:',
    ...(hits.length ? hits : ['1. 未命中常见反模式，仍建议在目标库执行 EXPLAIN']),
  ].join('\n')
}

export const SQLEXPLAIN_SAMPLE =
  "SELECT * FROM user WHERE name LIKE '%a%' OR age > 18 ORDER BY id"
