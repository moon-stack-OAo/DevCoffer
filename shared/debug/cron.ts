/** Cron 解析：支持 5～7 段（秒 分 时 日 月 周 [年]），下次执行与中文描述 */

export type CronFieldId = 'second' | 'minute' | 'hour' | 'dom' | 'month' | 'dow' | 'year'

export interface CronFieldDef {
  id: CronFieldId
  name: string
  min: number
  max: number
  values: number[]
}

export interface CronState {
  second: string
  minute: string
  hour: string
  dom: string
  month: string
  dow: string
  year: string
}

export const DOW_LABELS: Record<number, string> = {
  0: '日',
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '日',
}

export const MONTH_LABELS: Record<number, string> = {
  1: '1月',
  2: '2月',
  3: '3月',
  4: '4月',
  5: '5月',
  6: '6月',
  7: '7月',
  8: '8月',
  9: '9月',
  10: '10月',
  11: '11月',
  12: '12月',
}

const FIELD_NAMES = ['秒', '分', '时', '日', '月', '周', '年'] as const

function yearRange(): { min: number; max: number; values: number[] } {
  const min = new Date().getFullYear()
  const max = min + 10
  const values: number[] = []
  for (let y = min; y <= max; y++) values.push(y)
  return { min, max, values }
}

export function getCronFields(): CronFieldDef[] {
  const yr = yearRange()
  return [
    {
      id: 'second',
      name: '秒',
      min: 0,
      max: 59,
      values: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
    },
    {
      id: 'minute',
      name: '分',
      min: 0,
      max: 59,
      values: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
    },
    {
      id: 'hour',
      name: '时',
      min: 0,
      max: 23,
      values: Array.from({ length: 24 }, (_, i) => i),
    },
    {
      id: 'dom',
      name: '日',
      min: 1,
      max: 31,
      values: Array.from({ length: 31 }, (_, i) => i + 1),
    },
    {
      id: 'month',
      name: '月',
      min: 1,
      max: 12,
      values: Array.from({ length: 12 }, (_, i) => i + 1),
    },
    { id: 'dow', name: '周', min: 0, max: 7, values: [0, 1, 2, 3, 4, 5, 6, 7] },
    { id: 'year', name: '年', min: yr.min, max: yr.max, values: yr.values },
  ]
}

export const DEFAULT_CRON_STATE: CronState = {
  second: '0',
  minute: '*',
  hour: '*',
  dom: '*',
  month: '*',
  dow: '*',
  year: '*',
}

export function guessCronStep(field: CronFieldDef): number {
  if (field.max <= 12) return 1
  if (field.max === 23) return 2
  return 5
}

export function cronModeOf(state: string): 0 | 1 | 2 {
  if (state === '*') return 0
  if (state.includes('/')) return 1
  return 2
}

export function buildCronExpr(state: CronState): string {
  return [state.second, state.minute, state.hour, state.dom, state.month, state.dow, state.year].join(' ')
}

/** 将 5/6/7 段表达式规范为 7 段；非法长度抛错 */
export function normalizeCronFields(expr: string): string[] {
  const raw = String(expr || '').trim()
  if (!raw) throw new Error('请输入 Cron 表达式')
  const fields = raw.split(/\s+/)
  if (fields.length === 5) {
    fields.unshift('0')
    fields.push('*')
  } else if (fields.length === 6) {
    fields.push('*')
  } else if (fields.length !== 7) {
    throw new Error('Cron 需要 5~7 段 (秒 分 时 日 月 周 [年])')
  }
  return fields
}

export function parseExprToState(expr: string): CronState {
  const parts = String(expr || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 5) {
    return {
      second: '0',
      minute: parts[0]!,
      hour: parts[1]!,
      dom: parts[2]!,
      month: parts[3]!,
      dow: parts[4]!,
      year: '*',
    }
  }
  if (parts.length === 6) {
    return {
      second: parts[0]!,
      minute: parts[1]!,
      hour: parts[2]!,
      dom: parts[3]!,
      month: parts[4]!,
      dow: parts[5]!,
      year: '*',
    }
  }
  if (parts.length === 7) {
    return {
      second: parts[0]!,
      minute: parts[1]!,
      hour: parts[2]!,
      dom: parts[3]!,
      month: parts[4]!,
      dow: parts[5]!,
      year: parts[6]!,
    }
  }
  return { ...DEFAULT_CRON_STATE }
}

export function cronParseField(field: string, min: number, max: number): number[] {
  const values = new Set<number>()
  let f = String(field || '*')
    .replace(/JAN/gi, '1')
    .replace(/FEB/gi, '2')
    .replace(/MAR/gi, '3')
    .replace(/APR/gi, '4')
    .replace(/MAY/gi, '5')
    .replace(/JUN/gi, '6')
    .replace(/JUL/gi, '7')
    .replace(/AUG/gi, '8')
    .replace(/SEP/gi, '9')
    .replace(/OCT/gi, '10')
    .replace(/NOV/gi, '11')
    .replace(/DEC/gi, '12')
    .replace(/SUN/gi, '0')
    .replace(/MON/gi, '1')
    .replace(/TUE/gi, '2')
    .replace(/WED/gi, '3')
    .replace(/THU/gi, '4')
    .replace(/FRI/gi, '5')
    .replace(/SAT/gi, '6')

  for (const part of f.split(',')) {
    if (part === '*' || part === '?') {
      for (let i = min; i <= max; i++) values.add(i)
    } else if (part.includes('/')) {
      const [range, stepStr] = part.split('/')
      const step = parseInt(stepStr!, 10)
      if (!step) continue
      if (range === '*' || !range) {
        for (let i = min; i <= max; i += step) values.add(i)
      } else if (range.includes('-')) {
        const [a, b] = range.split('-').map(Number)
        for (let i = a!; i <= b!; i += step) values.add(i)
      } else {
        for (let i = parseInt(range, 10); i <= max; i += step) values.add(i)
      }
    } else if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number)
      for (let i = a!; i <= b!; i++) values.add(i)
    } else {
      const v = parseInt(part, 10)
      if (!isNaN(v) && v >= min && v <= max) values.add(v)
    }
  }
  return [...values].sort((a, b) => a - b)
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatCronDate(d: Date): string {
  return (
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}  ` +
    `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
  )
}

export function describeCronFields(fields: string[]): string {
  return fields
    .map((f, i) => `${FIELD_NAMES[i]}=${f === '*' || f === '?' ? '任意' : f}`)
    .join(' | ')
}

/** 计算下次执行时间（本地时区），对齐旧站逐秒推进逻辑 */
export function nextCronRuns(expr: string, count = 5, from?: Date): string[] {
  const fields = normalizeCronFields(expr)
  const ranges: [number, number][] = [
    [0, 59],
    [0, 59],
    [0, 23],
    [1, 31],
    [1, 12],
    [0, 7],
    [1970, 2099],
  ]
  const parsed = fields.map((f, i) => cronParseField(f, ranges[i]![0], ranges[i]![1]))
  const [seconds, minutes, hours, doms, months, dows, years] = parsed as [
    number[],
    number[],
    number[],
    number[],
    number[],
    number[],
    number[],
  ]

  if (dows.includes(7) && !dows.includes(0)) dows.push(0)
  if (dows.includes(0) && !dows.includes(7)) dows.push(7)

  const domWild = fields[3] === '*' || fields[3] === '?'
  const dowWild = fields[5] === '*' || fields[5] === '?'
  const yearWild = fields[6] === '*' || fields[6] === '?'

  if (!seconds.length || !minutes.length || !hours.length || !years.length) {
    throw new Error('Cron 表达式不匹配任何时间')
  }

  const results: Date[] = []
  const current = from ? new Date(from.getTime()) : new Date()
  current.setSeconds(0, 0)
  let maxIter = 525600

  while (results.length < count && maxIter-- > 0) {
    const m = current.getMonth() + 1
    const d = current.getDate()
    const dw = current.getDay()
    const h = current.getHours()
    const min = current.getMinutes()
    const sec = current.getSeconds()
    const y = current.getFullYear()

    if (!yearWild && !years.includes(y)) {
      current.setFullYear(y + 1)
      current.setMonth(0, 1)
      current.setHours(0, 0, 0, 0)
      continue
    }
    if (!months.includes(m)) {
      current.setMonth(current.getMonth() + 1)
      current.setDate(1)
      current.setHours(0, 0, 0, 0)
      continue
    }

    let dayMatch: boolean
    if (domWild && dowWild) dayMatch = true
    else if (!domWild && !dowWild) dayMatch = doms.includes(d) || dows.includes(dw)
    else if (!domWild) dayMatch = doms.includes(d)
    else dayMatch = dows.includes(dw)

    if (!dayMatch) {
      current.setDate(d + 1)
      current.setHours(0, 0, 0, 0)
      continue
    }
    if (!hours.includes(h)) {
      current.setHours(h + 1, 0, 0, 0)
      continue
    }
    if (!minutes.includes(min)) {
      current.setMinutes(min + 1, 0, 0)
      continue
    }
    if (!seconds.includes(sec)) {
      current.setSeconds(sec + 1, 0)
      continue
    }

    results.push(new Date(current))
    current.setSeconds(sec + 1, 0)
  }

  if (!results.length) throw new Error('无法计算下次执行时间')
  return results.map(formatCronDate)
}

export interface CronParseResult {
  fields: string[]
  description: string
  runs: string[]
  text: string
}

export function parseCron(expr: string, count = 5): CronParseResult {
  const fields = normalizeCronFields(expr)
  const description = describeCronFields(fields)
  const runs = nextCronRuns(expr, count)
  const text = runs.map((r, i) => `${i + 1}. ${r}`).join('\n')
  return { fields, description, runs, text }
}

export function formatCronNext(expr: string, count = 5): string {
  const r = parseCron(expr, count)
  return `表达式: ${r.fields.join(' ')}\n${r.description}\n下次 ${r.runs.length} 次:\n${r.text}`
}

export const CRON_PRESETS: { label: string; expr: string }[] = [
  { label: '每5分钟', expr: '*/5 * * * *' },
  { label: '每小时', expr: '0 * * * *' },
  { label: '每天凌晨', expr: '0 0 * * *' },
  { label: '每周一', expr: '0 0 * * 1' },
  { label: '每月1号', expr: '0 0 1 * *' },
]
