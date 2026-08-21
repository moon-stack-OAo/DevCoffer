/** SQL 格式化（sql-formatter）+ 压缩 + 基础启发式校验 */

export const SQL_DIALECTS = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'plsql', label: 'Oracle PL/SQL' },
  { value: 'tsql', label: 'SQL Server' },
  { value: 'bigquery', label: 'BigQuery' },
] as const

export type SqlDialect = (typeof SQL_DIALECTS)[number]['value']

export const SQL_SAMPLE =
  'select id, name from users where status = 1 and age > 18 order by id desc limit 10'

/** 去掉注释后的 SQL 文本（用于启发式校验） */
function stripSqlComments(input: string): string {
  return String(input || '')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
}

function checkParenBalance(s: string): boolean {
  let depth = 0
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!
    const prev = i > 0 ? s[i - 1] : ''
    if (ch === "'" && !inDouble && prev !== '\\') inSingle = !inSingle
    else if (ch === '"' && !inSingle && prev !== '\\') inDouble = !inDouble
    if (inSingle || inDouble) continue
    if (ch === '(') depth++
    else if (ch === ')') {
      depth--
      if (depth < 0) return false
    }
  }
  return depth === 0
}

/**
 * 基础 SQL 启发式校验：拦明显烂输入，不对「库能吞」的合法 SQL 误报。
 * 失败时抛出中文 Error。
 */
export function lintSqlBasic(input: string): void {
  const raw = String(input ?? '')
  if (!raw.trim()) throw new Error('请输入 SQL')

  const text = stripSqlComments(raw).replace(/\s+/g, ' ').trim()
  if (!text) throw new Error('请输入有效 SQL（注释之外为空）')

  if (!checkParenBalance(text)) {
    throw new Error('括号不平衡，请检查 ( ) 是否成对')
  }

  // SELECT 后无列：SELECT FROM / SELECT WHERE / SELECT;
  if (/\bSELECT\s+(FROM|WHERE|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|;|$)/i.test(text)) {
    throw new Error('SELECT 后缺少列或表达式')
  }

  // WHERE 后无条件：WHERE ORDER BY / WHERE GROUP BY / WHERE; / WHERE 结尾
  if (/\bWHERE\s+(GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|;|$)/i.test(text)) {
    throw new Error('WHERE 后缺少条件表达式')
  }

  // FROM 后无表：FROM WHERE / FROM ORDER / FROM;
  if (/\bFROM\s+(WHERE|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|;|$)/i.test(text)) {
    throw new Error('FROM 后缺少表名')
  }

  // INSERT INTO 无表或无 VALUES/SELECT
  if (/\bINSERT\s+INTO\s+(VALUES|;|$)/i.test(text)) {
    throw new Error('INSERT INTO 后缺少表名')
  }

  // UPDATE 无 SET
  if (/\bUPDATE\b/i.test(text) && !/\bSET\b/i.test(text)) {
    throw new Error('UPDATE 语句缺少 SET 子句')
  }
}

export function minifySql(input: string): string {
  lintSqlBasic(input)
  return String(input || '')
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function formatSql(
  input: string,
  dialect: SqlDialect | string = 'sql',
): Promise<string> {
  const raw = String(input || '')
  lintSqlBasic(raw)
  const { format } = await import('sql-formatter')
  return format(raw, {
    language: dialect as 'sql',
    tabWidth: 2,
    keywordCase: 'upper',
  })
}
