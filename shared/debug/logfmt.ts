/** 日志格式化 — logback/log4j2 风格解析（对照旧站 logfmt.js） */

export const LOG_PATTERN =
  /^\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:[.,]\d+)?)\s+(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\s+\[([^\]]+)\]\s+([\w$.\-]+)\s*[-:]\s*(.*)$/

const STACK_FRAME = /^\s*at\s+/
const CAUSED_BY = /^\s*Caused by:\s*/
const EXCEPTION_FIRST =
  /^\s*([A-Za-z_][\w$.]*(?:Exception|Error|Throwable))(?::\s*(.*))?$/
const ELLIPSIS_FRAME = /^\s*\.\.\.\s+\d+\s+more$/

export type LogLevelName = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'

export type LogEntry = {
  timestamp: string
  level: LogLevelName
  thread: string
  logger: string
  message: string
  raw: string
}

export type LogGroup = {
  entry: LogEntry | null
  frames: string[]
}

export const ALL_LEVELS: LogLevelName[] = [
  'TRACE',
  'DEBUG',
  'INFO',
  'WARN',
  'ERROR',
  'FATAL',
]

export type LevelFilter = Record<LogLevelName, boolean>

export function defaultLevelFilter(): LevelFilter {
  return {
    TRACE: true,
    DEBUG: true,
    INFO: true,
    WARN: true,
    ERROR: true,
    FATAL: true,
  }
}

export function parseLogLine(line: string): LogEntry | null {
  const m = line.match(LOG_PATTERN)
  if (!m) return null
  return {
    timestamp: m[1]!,
    level: m[2] as LogLevelName,
    thread: m[3]!,
    logger: m[4]!,
    message: m[5]!,
    raw: line,
  }
}

export function parseLog(text: string): LogGroup[] {
  const lines = String(text || '').split(/\r?\n/)
  const groups: LogGroup[] = []
  let current: LogGroup | null = null

  for (const line of lines) {
    if (!line) {
      if (current) {
        groups.push(current)
        current = null
      }
      continue
    }
    const entry = parseLogLine(line)
    if (entry) {
      if (current) groups.push(current)
      current = { entry, frames: [] }
      continue
    }
    if (STACK_FRAME.test(line) || CAUSED_BY.test(line) || ELLIPSIS_FRAME.test(line)) {
      if (current) current.frames.push(line)
      else current = { entry: null, frames: [line] }
      continue
    }
    if (EXCEPTION_FIRST.test(line)) {
      if (current) current.frames.push(line)
      else current = { entry: null, frames: [line] }
      continue
    }
    if (current) current.frames.push(line)
    else current = { entry: null, frames: [line] }
  }
  if (current) groups.push(current)
  return groups
}

export function filterGroups(
  groups: LogGroup[],
  levels: LevelFilter,
  keyword = '',
): LogGroup[] {
  const kw = keyword.trim().toLowerCase()
  return groups.filter((g) => {
    if (g.entry && !levels[g.entry.level]) return false
    if (!kw) return true
    const hay = (
      (g.entry
        ? [g.entry.timestamp, g.entry.level, g.entry.thread, g.entry.logger, g.entry.message, g.entry.raw]
        : []
      ).concat(g.frames)
    )
      .join('\n')
      .toLowerCase()
    return hay.includes(kw)
  })
}

export function countByLevel(groups: LogGroup[]): Record<string, number> {
  const c: Record<string, number> = {
    TRACE: 0,
    DEBUG: 0,
    INFO: 0,
    WARN: 0,
    ERROR: 0,
    FATAL: 0,
    OTHER: 0,
  }
  for (const g of groups) {
    if (g.entry) c[g.entry.level] = (c[g.entry.level] || 0) + 1
    else c.OTHER!++
  }
  return c
}

export function formatGroupPlain(g: LogGroup): string {
  const lines: string[] = []
  if (g.entry) {
    lines.push(
      `${g.entry.timestamp} ${g.entry.level.padEnd(5)} [${g.entry.thread}] ${g.entry.logger} - ${g.entry.message}`,
    )
  }
  for (const f of g.frames) lines.push(f)
  return lines.join('\n')
}

export function formatGroupsPlain(groups: LogGroup[]): string {
  if (!groups.length) return '(无匹配行)'
  return groups.map(formatGroupPlain).join('\n\n')
}

/** 兼容旧 API：级别门槛过滤 */
export type LogLevel = LogLevelName | 'ALL'

const ORDER: Record<string, number> = {
  TRACE: 10,
  DEBUG: 20,
  INFO: 30,
  WARN: 40,
  ERROR: 50,
  FATAL: 60,
}

export function filterLogLines(
  text: string,
  minLevel: LogLevel = 'ALL',
  keyword = '',
): string {
  const levels = defaultLevelFilter()
  if (minLevel !== 'ALL') {
    const min = ORDER[minLevel] || 0
    for (const lv of ALL_LEVELS) {
      levels[lv] = (ORDER[lv] || 0) >= min
    }
  }
  const groups = filterGroups(parseLog(text), levels, keyword)
  return formatGroupsPlain(groups)
}

export const LOGFMT_SAMPLES: Record<string, string> = {
  springboot:
    '2024-05-20 10:23:45.123  INFO [http-nio-8080-exec-1] com.example.OrderController - Order created id=1001 amount=99.50\n' +
    '2024-05-20 10:23:46.456 DEBUG [http-nio-8080-exec-1] com.example.OrderService - Querying user: userId=42\n' +
    '2024-05-20 10:23:47.789  WARN [http-nio-8080-exec-2] com.example.PaymentClient - Payment gateway slow response: 2.3s\n' +
    '2024-05-20 10:23:48.012 ERROR [http-nio-8080-exec-2] com.example.OrderService - Failed to create order\n' +
    'java.lang.NullPointerException: customer name is null\n' +
    '\tat com.example.OrderService.create(OrderService.java:45)\n' +
    '\tat com.example.OrderController.checkout(OrderController.java:78)\n' +
    '\t... 30 more\n' +
    'Caused by: java.lang.IllegalArgumentException: invalid input\n' +
    '\tat com.example.OrderService.validate(OrderService.java:23)\n' +
    '\t... 31 more\n' +
    '2024-05-20 10:23:50.500  INFO [scheduling-1] com.example.CleanupJob - Cleanup task completed in 1.2s',
  error:
    '2024-06-01 09:00:00.000 ERROR [DubboServerHandler-thread-50] com.example.DubboProtocol - Failed to invoke remote method\n' +
    'java.lang.RuntimeException: Service call failed\n' +
    '\tat com.example.DubboInvoker.doInvoke(DubboInvoker.java:107)\n' +
    '\t... 25 more\n' +
    'Caused by: java.net.ConnectException: Connection refused\n' +
    '\tat sun.nio.ch.Net.connect(Native Method)\n' +
    '\t... 20 more',
  simple:
    '2024-01-15 08:00:00.000  INFO [main] com.example.App - Application started\n' +
    '2024-01-15 08:00:01.234  WARN [main] com.example.App - Config file not found, using defaults\n' +
    '2024-01-15 08:00:02.567  INFO [main] com.example.App - Listening on port 8080',
}
