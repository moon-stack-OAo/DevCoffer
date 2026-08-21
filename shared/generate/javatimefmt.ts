/** Java DateTimeFormatter 模式试算（浏览器模拟，对齐旧站 javatimefmt） */

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export type JtfParseDateResult =
  | { ok: true; date: Date }
  | { ok: false; msg: string }

export type JtfFormatResult =
  | { ok: true; result: string }
  | { ok: false; msg: string }

export type JtfParseFields = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  millisecond: number
  raw: Record<string, string>
}

export type JtfParseResult =
  | { ok: true; result: string; fields: JtfParseFields; msg: string }
  | { ok: false; msg: string }

export type JtfFormatOptions = {
  /** 固定时区偏移（分钟，东为正），用于可重复测试 */
  timezoneOffsetMin?: number
}

export type JtfPatternHelpItem = {
  letter: string
  meaning: string
  example: string
}

export type JtfPreset = {
  name: string
  pattern: string
  desc: string
}

type JtfParts = {
  y: number
  M: number
  d: number
  H: number
  h: number
  m: number
  s: number
  S: number
  a: string
  day: number
  offsetMin: number
}

/** 解析日期输入：空→当前；ISO；yyyy-MM-dd[ HH:mm:ss[.SSS]]；时间戳 */
export function jtfParseDateInput(dateInput?: string | null): JtfParseDateResult {
  if (dateInput == null || String(dateInput).trim() === '') {
    return { ok: true, date: new Date() }
  }
  const s = String(dateInput).trim()
  const iso = Date.parse(s)
  if (
    !isNaN(iso) &&
    (/T/.test(s) || /Z$/i.test(s) || /[+-]\d{2}:?\d{2}$/.test(s) || /^\d{4}-\d{2}-\d{2}$/.test(s))
  ) {
    return { ok: true, date: new Date(iso) }
  }
  const m = s.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2})(?:\.(\d{1,3}))?)?)?$/,
  )
  if (m) {
    const y = parseInt(m[1]!, 10)
    const mo = parseInt(m[2]!, 10) - 1
    const d = parseInt(m[3]!, 10)
    const h = m[4] != null ? parseInt(m[4], 10) : 0
    const mi = m[5] != null ? parseInt(m[5], 10) : 0
    const se = m[6] != null ? parseInt(m[6], 10) : 0
    const ms = m[7] != null ? parseInt((m[7] + '000').slice(0, 3), 10) : 0
    const dt = new Date(y, mo, d, h, mi, se, ms)
    if (isNaN(dt.getTime())) return { ok: false, msg: '日期无效' }
    return { ok: true, date: dt }
  }
  if (/^\d{10}$/.test(s)) {
    return { ok: true, date: new Date(parseInt(s, 10) * 1000) }
  }
  if (/^\d{13}$/.test(s)) {
    return { ok: true, date: new Date(parseInt(s, 10)) }
  }
  if (!isNaN(iso)) {
    return { ok: true, date: new Date(iso) }
  }
  return { ok: false, msg: '无法解析日期，请用 ISO 或 yyyy-MM-dd HH:mm:ss' }
}

function jtfPad(n: number, len: number): string {
  let s = String(Math.abs(n))
  while (s.length < len) s = '0' + s
  return (n < 0 ? '-' : '') + s
}

function jtfToken(letter: string, len: number, p: JtfParts): string {
  switch (letter) {
    case 'y':
    case 'Y':
      if (len === 2) return jtfPad(p.y % 100, 2)
      return jtfPad(p.y, Math.max(len, 4))
    case 'M':
      if (len === 1) return String(p.M)
      if (len === 2) return jtfPad(p.M, 2)
      return jtfPad(p.M, 2)
    case 'd':
      return len === 1 ? String(p.d) : jtfPad(p.d, Math.min(len, 2) === 1 ? 1 : 2)
    case 'H':
      return len === 1 ? String(p.H) : jtfPad(p.H, 2)
    case 'h':
      return len === 1 ? String(p.h) : jtfPad(p.h, 2)
    case 'm':
      return len === 1 ? String(p.m) : jtfPad(p.m, 2)
    case 's':
      return len === 1 ? String(p.s) : jtfPad(p.s, 2)
    case 'S': {
      const ms = jtfPad(p.S, 3)
      if (len <= 3) return ms.slice(0, len)
      return ms + jtfPad(0, len - 3)
    }
    case 'a':
      return p.a
    case 'E':
      if (len >= 4) return WEEKDAYS_FULL[p.day]!
      return WEEKDAYS_SHORT[p.day]!
    case 'Z': {
      const sign = p.offsetMin >= 0 ? '+' : '-'
      const abs = Math.abs(p.offsetMin)
      const oh = Math.floor(abs / 60)
      const om = abs % 60
      if (len >= 5) return sign + jtfPad(oh, 2) + ':' + jtfPad(om, 2)
      return sign + jtfPad(oh, 2) + jtfPad(om, 2)
    }
    case 'X': {
      const sign2 = p.offsetMin >= 0 ? '+' : '-'
      const abs2 = Math.abs(p.offsetMin)
      const oh2 = Math.floor(abs2 / 60)
      const om2 = abs2 % 60
      if (p.offsetMin === 0 && len === 1) return 'Z'
      if (len === 1) return sign2 + jtfPad(oh2, 2) + (om2 ? jtfPad(om2, 2) : '')
      if (len === 2) return sign2 + jtfPad(oh2, 2) + jtfPad(om2, 2)
      return sign2 + jtfPad(oh2, 2) + ':' + jtfPad(om2, 2)
    }
    case 'n':
      return jtfPad(p.S * 1000000, Math.min(len, 9))
    default: {
      let t = ''
      for (let i = 0; i < len; i++) t += letter
      return t
    }
  }
}

function jtfApplyPattern(pattern: string, parts: JtfParts): string {
  let out = ''
  let i = 0
  while (i < pattern.length) {
    const c = pattern.charAt(i)
    if (c === "'") {
      if (pattern.charAt(i + 1) === "'") {
        out += "'"
        i += 2
        continue
      }
      let j = i + 1
      let lit = ''
      while (j < pattern.length) {
        if (pattern.charAt(j) === "'") {
          if (pattern.charAt(j + 1) === "'") {
            lit += "'"
            j += 2
            continue
          }
          break
        }
        lit += pattern.charAt(j)
        j++
      }
      if (j >= pattern.length && pattern.charAt(pattern.length - 1) !== "'") {
        throw new Error('未闭合的引号字面量')
      }
      out += lit
      i = j + 1
      continue
    }
    if (/[A-Za-z]/.test(c)) {
      let k = i
      while (k < pattern.length && pattern.charAt(k) === c) k++
      out += jtfToken(c, k - i, parts)
      i = k
      continue
    }
    out += c
    i++
  }
  return out
}

/** 用模拟 DateTimeFormatter 格式化 */
export function javaTimeFmtFormat(
  pattern: string,
  dateInput?: string | null,
  options?: JtfFormatOptions,
): JtfFormatResult {
  if (pattern == null || String(pattern).trim() === '') {
    return { ok: false, msg: '请输入 pattern' }
  }
  const pat = String(pattern)
  const parsed = jtfParseDateInput(dateInput)
  if (!parsed.ok) return { ok: false, msg: parsed.msg }
  const date = parsed.date
  const opts = options || {}

  const useOffset = typeof opts.timezoneOffsetMin === 'number'
  let y: number
  let M: number
  let d: number
  let H: number
  let m: number
  let s: number
  let S: number
  let day: number
  let offsetMin: number

  if (useOffset) {
    offsetMin = opts.timezoneOffsetMin!
    const utc = date.getTime() + date.getTimezoneOffset() * 60000
    const local = new Date(utc + offsetMin * 60000)
    y = local.getFullYear()
    M = local.getMonth() + 1
    d = local.getDate()
    H = local.getHours()
    m = local.getMinutes()
    s = local.getSeconds()
    S = local.getMilliseconds()
    day = local.getDay()
  } else {
    y = date.getFullYear()
    M = date.getMonth() + 1
    d = date.getDate()
    H = date.getHours()
    m = date.getMinutes()
    s = date.getSeconds()
    S = date.getMilliseconds()
    day = date.getDay()
    offsetMin = -date.getTimezoneOffset()
  }

  let h12 = H % 12
  if (h12 === 0) h12 = 12
  const ampm = H < 12 ? 'AM' : 'PM'

  try {
    const result = jtfApplyPattern(pat, {
      y,
      M,
      d,
      H,
      h: h12,
      m,
      s,
      S,
      a: ampm,
      day,
      offsetMin,
    })
    return { ok: true, result }
  } catch (e) {
    return { ok: false, msg: e instanceof Error ? e.message : String(e) }
  }
}

/** 尽力按 pattern 解析文本（简化） */
export function javaTimeFmtParse(pattern: string, text: string): JtfParseResult {
  if (pattern == null || String(pattern).trim() === '') {
    return { ok: false, msg: '请输入 pattern' }
  }
  if (text == null || String(text).trim() === '') {
    return { ok: false, msg: '请输入待解析文本' }
  }
  const pat = String(pattern)
  const src = String(text).trim()

  let reParts = ''
  const fields: { letter: string; len: number; name: string }[] = []
  let i = 0
  while (i < pat.length) {
    const c = pat.charAt(i)
    if (c === "'") {
      if (pat.charAt(i + 1) === "'") {
        reParts += "'"
        i += 2
        continue
      }
      let j = i + 1
      let lit = ''
      while (j < pat.length && pat.charAt(j) !== "'") {
        lit += pat.charAt(j)
        j++
      }
      reParts += lit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      i = j + 1
      continue
    }
    if (/[A-Za-z]/.test(c)) {
      let k = i
      while (k < pat.length && pat.charAt(k) === c) k++
      const len = k - i
      const name = c + len
      if ('yYMdHhmSs'.indexOf(c) >= 0) {
        reParts += '(\\d{1,' + Math.max(len, 4) + '})'
        fields.push({ letter: c, len, name })
      } else if (c === 'a') {
        reParts += '(AM|PM|am|pm)'
        fields.push({ letter: c, len, name })
      } else if (c === 'E') {
        reParts += '([A-Za-z]+)'
        fields.push({ letter: c, len, name })
      } else if (c === 'Z' || c === 'X') {
        reParts += '([Zz]|[+-]\\d{2}:?\\d{2})'
        fields.push({ letter: c, len, name })
      } else {
        return {
          ok: false,
          msg: '解析不支持字母 "' + c + '"（仅支持 y/M/d/H/h/m/s/S/a/E/Z/X 的简化解析）',
        }
      }
      i = k
      continue
    }
    reParts += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    i++
  }

  const re = new RegExp('^' + reParts + '$')
  const m = src.match(re)
  if (!m) {
    return {
      ok: false,
      msg: '文本与 pattern 不匹配。浏览器模拟解析能力有限，复杂本地化/时区请用 JDK DateTimeFormatter。',
    }
  }

  const extracted: Record<string, string> = {}
  for (let fi = 0; fi < fields.length; fi++) {
    extracted[fields[fi]!.letter] = m[fi + 1]!
  }

  let year =
    extracted.y != null
      ? parseInt(extracted.y, 10)
      : extracted.Y != null
        ? parseInt(extracted.Y, 10)
        : 1970
  if (extracted.y != null && extracted.y.length === 2) {
    year = year >= 70 ? 1900 + year : 2000 + year
  }
  const month = extracted.M != null ? parseInt(extracted.M, 10) : 1
  const day = extracted.d != null ? parseInt(extracted.d, 10) : 1
  let hour = extracted.H != null ? parseInt(extracted.H, 10) : 0
  if (extracted.h != null) {
    hour = parseInt(extracted.h, 10) % 12
    if (extracted.a && String(extracted.a).toUpperCase() === 'PM') hour += 12
  }
  const minute = extracted.m != null ? parseInt(extracted.m, 10) : 0
  const second = extracted.s != null ? parseInt(extracted.s, 10) : 0
  const ms = extracted.S != null ? parseInt((extracted.S + '000').slice(0, 3), 10) : 0

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { ok: false, msg: '解析出的日期字段无效' }
  }

  const iso =
    jtfPad(year, 4) +
    '-' +
    jtfPad(month, 2) +
    '-' +
    jtfPad(day, 2) +
    'T' +
    jtfPad(hour, 2) +
    ':' +
    jtfPad(minute, 2) +
    ':' +
    jtfPad(second, 2) +
    '.' +
    jtfPad(ms, 3)

  return {
    ok: true,
    result: iso,
    fields: {
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond: ms,
      raw: extracted,
    },
    msg: '简化解析成功（本地字段，未完整处理时区/本地化）',
  }
}

/** 模式字母速查 */
export function javaTimeFmtPatternHelp(): JtfPatternHelpItem[] {
  return [
    { letter: 'yyyy', meaning: '四位年份', example: '2026' },
    { letter: 'yy', meaning: '两位年份', example: '26' },
    { letter: 'MM', meaning: '两位月份', example: '08' },
    { letter: 'M', meaning: '月份（不补零）', example: '8' },
    { letter: 'dd', meaning: '两位日', example: '03' },
    { letter: 'd', meaning: '日（不补零）', example: '3' },
    { letter: 'HH', meaning: '24 小时制小时 00-23', example: '14' },
    { letter: 'H', meaning: '小时（不补零）', example: '14' },
    { letter: 'hh', meaning: '12 小时制 01-12', example: '02' },
    { letter: 'h', meaning: '12 小时制（不补零）', example: '2' },
    { letter: 'mm', meaning: '分钟', example: '05' },
    { letter: 'ss', meaning: '秒', example: '09' },
    { letter: 'SSS', meaning: '毫秒', example: '123' },
    { letter: 'a', meaning: 'AM/PM', example: 'PM' },
    { letter: 'EEE', meaning: '星期缩写（英文）', example: 'Mon' },
    { letter: 'EEEE', meaning: '星期全称（英文）', example: 'Monday' },
    { letter: 'Z', meaning: 'RFC 822 时区', example: '+0800' },
    { letter: 'XXX', meaning: 'ISO 时区偏移', example: '+08:00' },
    { letter: "''", meaning: '字面量（单引号包裹）', example: "'T'" },
  ]
}

/** 常见模板 */
export function javaTimeFmtPresets(): JtfPreset[] {
  return [
    { name: '日期', pattern: 'yyyy-MM-dd', desc: '常用日期' },
    { name: '日期时间', pattern: 'yyyy-MM-dd HH:mm:ss', desc: '常用日期时间' },
    { name: '紧凑', pattern: 'yyyyMMddHHmmss', desc: '无分隔紧凑' },
    { name: '毫秒', pattern: 'yyyy-MM-dd HH:mm:ss.SSS', desc: '含毫秒' },
    { name: 'ISO_LOCAL', pattern: "yyyy-MM-dd'T'HH:mm:ss", desc: 'ISO_LOCAL_DATE_TIME 近似' },
    { name: 'ISO_OFFSET', pattern: "yyyy-MM-dd'T'HH:mm:ssXXX", desc: '带偏移' },
    { name: '中文风格', pattern: 'yyyy年MM月dd日 HH:mm:ss', desc: '中文日期' },
    { name: '12小时', pattern: 'yyyy-MM-dd hh:mm:ss a', desc: '12 小时 + AM/PM' },
    { name: '斜杠', pattern: 'yyyy/MM/dd HH:mm:ss', desc: '斜杠分隔' },
    { name: '仅时间', pattern: 'HH:mm:ss', desc: '时间部分' },
  ]
}

/** 兼容旧导出名 */
export const JTF_PATTERN_HELP = javaTimeFmtPatternHelp().map((h) => ({
  p: h.letter,
  d: h.meaning,
}))
