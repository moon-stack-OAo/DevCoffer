export type DbTypeRow = { java: string; mysql: string; postgres: string; oracle: string }

export const DB_TYPE_MAP: DbTypeRow[] = [
  { java: 'String', mysql: 'VARCHAR(255)', postgres: 'VARCHAR(255)', oracle: 'VARCHAR2(255)' },
  { java: 'Integer', mysql: 'INT', postgres: 'INTEGER', oracle: 'NUMBER(10)' },
  { java: 'Long', mysql: 'BIGINT', postgres: 'BIGINT', oracle: 'NUMBER(19)' },
  { java: 'Boolean', mysql: 'TINYINT(1)', postgres: 'BOOLEAN', oracle: 'NUMBER(1)' },
  { java: 'BigDecimal', mysql: 'DECIMAL(19,2)', postgres: 'NUMERIC(19,2)', oracle: 'NUMBER(19,2)' },
  { java: 'LocalDateTime', mysql: 'DATETIME', postgres: 'TIMESTAMP', oracle: 'TIMESTAMP' },
  { java: 'LocalDate', mysql: 'DATE', postgres: 'DATE', oracle: 'DATE' },
  { java: 'byte[]', mysql: 'BLOB', postgres: 'BYTEA', oracle: 'BLOB' },
  { java: 'Text/CLOB', mysql: 'TEXT', postgres: 'TEXT', oracle: 'CLOB' },
]

export type DbDialect = 'all' | 'mysql' | 'postgres' | 'oracle'

/** 按关键字与方言筛选类型行 */
export function filterDbTypeMap(q: string, dialect: DbDialect = 'all'): DbTypeRow[] {
  const kw = String(q || '').trim().toLowerCase()
  return DB_TYPE_MAP.filter((r) => {
    if (!kw) return true
    const hay = [r.java, r.mysql, r.postgres, r.oracle].join(' ').toLowerCase()
    if (dialect === 'mysql') return (r.java + ' ' + r.mysql).toLowerCase().includes(kw)
    if (dialect === 'postgres') return (r.java + ' ' + r.postgres).toLowerCase().includes(kw)
    if (dialect === 'oracle') return (r.java + ' ' + r.oracle).toLowerCase().includes(kw)
    return hay.includes(kw)
  })
}

export function dbTypeTable(rows: DbTypeRow[] = DB_TYPE_MAP): string {
  const head = '| Java | MySQL | PostgreSQL | Oracle |\n|------|-------|------------|--------|'
  const body = rows.map((r) => '| ' + r.java + ' | ' + r.mysql + ' | ' + r.postgres + ' | ' + r.oracle + ' |')
  return [head, ...body].join('\n')
}
