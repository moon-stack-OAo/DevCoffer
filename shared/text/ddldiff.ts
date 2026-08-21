/**
 * DDL Schema 语义对比（启发式，非完整 SQL 引擎）
 * 仅针对 MySQL 风格 `CREATE TABLE ... ( ... );` 做粗解析：
 * - 按 CREATE TABLE 拆表
 * - 对比表增减
 * - 同表内列行级增删改
 */

import { lineDiff } from './diff'

export type DdlColumn = {
  name: string
  /** 去掉列名后的定义原文（类型 + 约束等） */
  def: string
  raw: string
}

export type DdlTable = {
  name: string
  columns: DdlColumn[]
  /** 表级约束/索引等非列行 */
  extras: string[]
}

const CONSTRAINT_RE =
  /^(primary\s+key|unique(\s+key)?|key|index|constraint|foreign\s+key|fulltext|spatial|check)\b/i

/** 按顶层逗号拆分（忽略括号内逗号） */
function splitTopLevelComma(body: string): string[] {
  const parts: string[] = []
  let depth = 0
  let cur = ''
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]!
    if (ch === '(') depth++
    else if (ch === ')') depth = Math.max(0, depth - 1)
    if (ch === ',' && depth === 0) {
      const t = cur.trim()
      if (t) parts.push(t)
      cur = ''
      continue
    }
    cur += ch
  }
  const last = cur.trim()
  if (last) parts.push(last)
  return parts
}

function stripIdent(name: string): string {
  return String(name || '')
    .trim()
    .replace(/^[`"'\[]+/, '')
    .replace(/[`"'\]]+$/, '')
}

function parseColumnLine(line: string): DdlColumn | null {
  const s = line.trim().replace(/,$/, '')
  if (!s || CONSTRAINT_RE.test(s)) return null
  const m = s.match(/^([`"'\[]?[A-Za-z_][\w$]*[`"'\]]?)\s+(.+)$/i)
  if (!m) return null
  return {
    name: stripIdent(m[1]!),
    def: m[2]!.trim().replace(/\s+/g, ' '),
    raw: s.replace(/\s+/g, ' '),
  }
}

/**
 * 启发式解析多段 CREATE TABLE
 * 不支持完整方言；复杂表达式/存储过程等可能漏解析
 */
export function parseDdlTables(ddl: string): DdlTable[] {
  const text = String(ddl ?? '')
  const tables: DdlTable[] = []
  const re =
    /create\s+table\s+(?:if\s+not\s+exists\s+)?([`"'\[]?[\w.]+[`"'\]]?)\s*\(/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const name = stripIdent(m[1]!).replace(/^.*\./, '')
    const start = m.index + m[0].length
    let depth = 1
    let i = start
    for (; i < text.length; i++) {
      const ch = text[i]!
      if (ch === '(') depth++
      else if (ch === ')') {
        depth--
        if (depth === 0) break
      }
    }
    if (depth !== 0) continue
    const body = text.slice(start, i)
    const columns: DdlColumn[] = []
    const extras: string[] = []
    for (const part of splitTopLevelComma(body)) {
      const col = parseColumnLine(part)
      if (col) columns.push(col)
      else {
        const t = part.trim().replace(/\s+/g, ' ')
        if (t) extras.push(t)
      }
    }
    tables.push({ name, columns, extras })
  }
  return tables
}

function normKey(s: string): string {
  return s.toLowerCase()
}

/** 生成中文结构化 Schema 对比报告 */
export function ddlSemanticDiff(a: string, b: string): string {
  const left = parseDdlTables(a)
  const right = parseDdlTables(b)
  if (!left.length && !right.length) {
    throw new Error(
      '未识别到 CREATE TABLE … (…)。当前为启发式解析（非完整 SQL 引擎），请确认 DDL 为 MySQL 风格建表语句。',
    )
  }

  const leftMap = new Map(left.map((t) => [normKey(t.name), t]))
  const rightMap = new Map(right.map((t) => [normKey(t.name), t]))
  const lines: string[] = []
  lines.push('【Schema 语义对比】（启发式，非完整 SQL 引擎）')
  lines.push('')

  const added: string[] = []
  const removed: string[] = []
  for (const [k, t] of rightMap) {
    if (!leftMap.has(k)) added.push(t.name)
  }
  for (const [k, t] of leftMap) {
    if (!rightMap.has(k)) removed.push(t.name)
  }

  lines.push('一、表级变化')
  if (!added.length && !removed.length) {
    lines.push('  （无表增减）')
  } else {
    for (const n of removed) lines.push(`  - 删除表: ${n}`)
    for (const n of added) lines.push(`  + 新增表: ${n}`)
  }
  lines.push('')

  lines.push('二、同表列变化')
  let anyCol = false
  const allNames = new Set([...leftMap.keys(), ...rightMap.keys()])
  for (const key of [...allNames].sort()) {
    const lt = leftMap.get(key)
    const rt = rightMap.get(key)
    if (!lt || !rt) continue

    const lc = new Map(lt.columns.map((c) => [normKey(c.name), c]))
    const rc = new Map(rt.columns.map((c) => [normKey(c.name), c]))
    const colLines: string[] = []

    for (const [ck, c] of lc) {
      if (!rc.has(ck)) colLines.push(`    - 删除列: ${c.name} ${c.def}`)
    }
    for (const [ck, c] of rc) {
      if (!lc.has(ck)) colLines.push(`    + 新增列: ${c.name} ${c.def}`)
    }
    for (const [ck, c] of lc) {
      const r = rc.get(ck)
      if (!r) continue
      if (normKey(c.def) !== normKey(r.def)) {
        colLines.push(`    ~ 修改列: ${c.name}`)
        colLines.push(`        A: ${c.def}`)
        colLines.push(`        B: ${r.def}`)
      }
    }

    if (colLines.length) {
      anyCol = true
      lines.push(`  表 ${lt.name}:`)
      lines.push(...colLines)
    }
  }
  if (!anyCol) lines.push('  （无列增减/修改）')
  lines.push('')

  lines.push('三、摘要')
  lines.push(
    `  A 表数=${left.length}，B 表数=${right.length}；删除表=${removed.length}，新增表=${added.length}`,
  )
  if (!added.length && !removed.length && !anyCol) {
    lines.push('  结论: Schema 在启发式解析范围内无差异')
  }

  return lines.join('\n')
}

/** 兼容：纯文本行 diff */
export function ddlLineDiff(a: string, b: string): string {
  return lineDiff(a, b)
}

export const DDLDIFF_SAMPLE_A = [
  'CREATE TABLE users (',
  '  id INT PRIMARY KEY,',
  '  name VARCHAR(50) NOT NULL,',
  '  status TINYINT DEFAULT 1',
  ');',
  '',
  'CREATE TABLE orders (',
  '  id BIGINT PRIMARY KEY,',
  '  user_id INT NOT NULL,',
  '  amount DECIMAL(10,2)',
  ');',
].join('\n')

export const DDLDIFF_SAMPLE_B = [
  'CREATE TABLE users (',
  '  id INT PRIMARY KEY,',
  '  name VARCHAR(100) NOT NULL,',
  '  email VARCHAR(120),',
  '  status TINYINT DEFAULT 1',
  ');',
  '',
  'CREATE TABLE order_items (',
  '  id BIGINT PRIMARY KEY,',
  '  order_id BIGINT NOT NULL,',
  '  sku VARCHAR(64)',
  ');',
].join('\n')
