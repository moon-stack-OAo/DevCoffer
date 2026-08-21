/** Java 堆栈解析 / 折叠 / 过滤 */

export type StackFrame = {
  class?: string
  method?: string
  file?: string
  line?: number
  omitted?: number
}

export type StackException = {
  type: string
  message: string
  frames: StackFrame[]
  causedBy: StackException | null
}

export function parseStackTrace(text: string): StackException[] {
  if (!text?.trim()) return []
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l)
  const exceptions: StackException[] = []
  let currentEx: StackException | null = null

  for (const line of lines) {
    const exMatch = line.match(/^([\w.$]+(?:Exception|Error|Throwable))(?::\s*(.*))?$/)
    if (exMatch) {
      currentEx = {
        type: exMatch[1]!,
        message: exMatch[2] || '',
        frames: [],
        causedBy: null,
      }
      exceptions.push(currentEx)
      continue
    }

    const causedByMatch = line.match(
      /^Caused by:\s*([\w.$]+(?:Exception|Error|Throwable))(?::\s*(.*))?$/,
    )
    if (causedByMatch && currentEx) {
      const causedEx: StackException = {
        type: causedByMatch[1]!,
        message: causedByMatch[2] || '',
        frames: [],
        causedBy: null,
      }
      currentEx.causedBy = causedEx
      currentEx = causedEx
      exceptions.push(causedEx)
      continue
    }

    const frameMatch = line.match(/^at\s+([\w.$]+)\.([\w$]+)\(([\w.]+):(\d+)\)$/)
    if (frameMatch && currentEx) {
      currentEx.frames.push({
        class: frameMatch[1],
        method: frameMatch[2],
        file: frameMatch[3],
        line: parseInt(frameMatch[4]!, 10),
      })
      continue
    }

    const nativeMatch = line.match(/^at\s+([\w.$]+)\.([\w$]+)\(Native Method\)$/)
    if (nativeMatch && currentEx) {
      currentEx.frames.push({
        class: nativeMatch[1],
        method: nativeMatch[2],
        file: 'Native Method',
        line: -1,
      })
      continue
    }

    const moreMatch = line.match(/^\.\.\.\s*(\d+)\s*more$/)
    if (moreMatch && currentEx) {
      currentEx.frames.push({ omitted: parseInt(moreMatch[1]!, 10) })
    }
  }
  return exceptions
}

const JDK_PREFIXES = [
  'java.',
  'javax.',
  'jdk.',
  'sun.',
  'com.sun.',
  'org.springframework.',
  'org.apache.',
  'org.hibernate.',
  'org.mybatis.',
]

export function formatStackTrace(
  text: string,
  options: { hideJdk?: boolean; collapse?: boolean } = {},
): string {
  const list = parseStackTrace(text)
  if (!list.length) throw new Error('未能解析堆栈')
  const lines: string[] = []
  const seen = new Set<StackException>()

  function dump(ex: StackException, prefix: string) {
    if (seen.has(ex)) return
    seen.add(ex)
    lines.push(prefix + ex.type + (ex.message ? ': ' + ex.message : ''))
    let frames = ex.frames
    if (options.hideJdk) {
      frames = frames.filter(
        (f) => !f.class || !JDK_PREFIXES.some((p) => f.class!.startsWith(p)),
      )
    }
    if (options.collapse) {
      const collapsed: StackFrame[] = []
      let skip = 0
      for (const f of frames) {
        if (f.omitted != null) {
          collapsed.push(f)
          continue
        }
        const isJdk = f.class && JDK_PREFIXES.some((p) => f.class!.startsWith(p))
        if (isJdk) {
          skip++
          continue
        }
        if (skip) {
          collapsed.push({ omitted: skip })
          skip = 0
        }
        collapsed.push(f)
      }
      if (skip) collapsed.push({ omitted: skip })
      frames = collapsed
    }
    for (const f of frames) {
      if (f.omitted != null) {
        lines.push(`    ... ${f.omitted} more`)
        continue
      }
      const loc =
        f.line != null && f.line >= 0 ? `${f.file}:${f.line}` : f.file || '?'
      lines.push(`    at ${f.class}.${f.method}(${loc})`)
    }
    if (ex.causedBy) dump(ex.causedBy, 'Caused by: ')
  }

  // 只从顶层未作为 causedBy 的异常开始
  const caused = new Set(list.map((e) => e.causedBy).filter(Boolean))
  for (const ex of list) {
    if (!caused.has(ex)) dump(ex, '')
  }
  return lines.join('\n')
}
