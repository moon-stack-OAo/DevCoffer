/** Java 线程 Dump 简单解析统计 */

export type ThreadInfo = {
  name: string
  id?: string
  daemon?: boolean
  prio?: string
  tid?: string
  nid?: string
  state: string
  lines: string[]
}

function normalizeState(rest: string): string {
  const s = String(rest || '').trim()
  const m = s.match(/\b(RUNNABLE|WAITING|TIMED_WAITING|BLOCKED|NEW|TERMINATED)\b/i)
  if (m) return m[1]!.toUpperCase()
  if (/runnable/i.test(s)) return 'RUNNABLE'
  if (/waiting on condition/i.test(s)) return 'WAITING'
  if (/timed waiting/i.test(s)) return 'TIMED_WAITING'
  if (/blocked/i.test(s)) return 'BLOCKED'
  return s.split(/\s+/)[0] || 'UNKNOWN'
}

export function parseThreadDump(text: string): {
  threads: ThreadInfo[]
  stats: Record<string, number>
  deadlocks: string[]
  summary: string
} {
  if (text == null || !String(text).trim()) {
    return { threads: [], stats: {}, deadlocks: [], summary: '无输入' }
  }
  const lines = String(text).split(/\r?\n/)
  const threads: ThreadInfo[] = []
  const deadlocks: string[] = []

  let inDeadlock = false
  let deadlockBuf: string[] = []
  for (const line of lines) {
    if (/Found\s+\d*\s*Java-level\s+deadlock/i.test(line)) {
      if (deadlockBuf.length) {
        deadlocks.push(deadlockBuf.join('\n').trim())
        deadlockBuf = []
      }
      inDeadlock = true
      deadlockBuf.push(line)
      continue
    }
    if (inDeadlock) {
      if (/^Java stack information for the threads listed above/i.test(line)) {
        deadlocks.push(deadlockBuf.join('\n').trim())
        deadlockBuf = []
        inDeadlock = false
        continue
      }
      if (/^"[^"]+"/.test(line)) {
        deadlocks.push(deadlockBuf.join('\n').trim())
        deadlockBuf = []
        inDeadlock = false
      } else {
        deadlockBuf.push(line)
        continue
      }
    }
  }
  if (deadlockBuf.length) deadlocks.push(deadlockBuf.join('\n').trim())

  const headerRe =
    /^"([^"]+)"\s*(?:#(\d+))?\s*(daemon)?\s*(?:prio=(\d+))?\s*(?:os_prio=(\d+))?\s*(?:cpu=[\d.]+ms)?\s*(?:elapsed=[\d.]+s)?\s*(?:tid=(\S+))?\s*(?:nid=(\S+))?\s*(.*)?$/i

  let current: ThreadInfo | null = null
  const flush = () => {
    if (current) {
      threads.push(current)
      current = null
    }
  }

  for (const line of lines) {
    if (line.charAt(0) === '"' && line.indexOf('"', 1) > 0) {
      const m = line.match(headerRe)
      if (m) {
        flush()
        current = {
          name: m[1]!,
          id: m[2],
          daemon: !!m[3],
          prio: m[4],
          tid: m[6],
          nid: m[7],
          state: normalizeState(m[8] || ''),
          lines: [line],
        }
        continue
      }
    }
    if (current) {
      current.lines.push(line)
      const sm = line.match(/^\s*java\.lang\.Thread\.State:\s*(\w+)/)
      if (sm) current.state = sm[1]!.toUpperCase()
    }
  }
  flush()

  const stats: Record<string, number> = {}
  for (const t of threads) {
    stats[t.state] = (stats[t.state] || 0) + 1
  }

  const summary = [
    `线程数: ${threads.length}`,
    `死锁段: ${deadlocks.length}`,
    '状态分布: ' +
      (Object.keys(stats).length
        ? Object.entries(stats)
            .map(([k, v]) => `${k}=${v}`)
            .join(', ')
        : '(无)'),
  ].join('\n')

  return { threads, stats, deadlocks, summary }
}

export function formatThreadDump(text: string): string {
  const r = parseThreadDump(text)
  const lines = [r.summary, '']
  if (r.deadlocks.length) {
    lines.push('=== 死锁 ===')
    r.deadlocks.forEach((d, i) => {
      lines.push(`#${i + 1}`)
      lines.push(d)
      lines.push('')
    })
  }
  lines.push('=== 线程列表 ===')
  r.threads.forEach((t, i) => {
    lines.push(`${i + 1}. [${t.state}] "${t.name}"${t.daemon ? ' daemon' : ''}`)
  })
  return lines.join('\n')
}
