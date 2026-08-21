/** 正则在线测试（match / replace） */

export type RegexMatchInfo = {
  index: number
  end: number
  match: string
  groups: string[]
}

export function regexTest(pattern: string, flags: string, text: string): { count: number; lines: string[] } {
  if (!pattern) throw new Error('请输入正则表达式')
  if (text == null || text === '') throw new Error('请输入测试文本')
  const regex = new RegExp(pattern, flags)
  const matches: string[] = []
  let count = 0
  const global = flags.includes('g')
  regex.lastIndex = 0
  if (global) {
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      count++
      const info =
        `[${match.index}-${regex.lastIndex}] "${match[0]}"` +
        (match.length > 1 ? ` groups: ${JSON.stringify(match.slice(1))}` : '')
      matches.push(info)
      if (count > 200) {
        matches.push('... (超过 200 个匹配，已截断)')
        break
      }
      if (match.index === regex.lastIndex) regex.lastIndex++
    }
  } else {
    const match = regex.exec(text)
    if (match) {
      count = 1
      matches.push(
        `[${match.index}-${match.index + match[0].length}] "${match[0]}"` +
          (match.length > 1 ? ` groups: ${JSON.stringify(match.slice(1))}` : ''),
      )
    }
  }
  return { count, lines: matches }
}

export function regexReplace(pattern: string, flags: string, text: string, replacement: string): string {
  if (!pattern) throw new Error('请输入正则表达式')
  const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
  return String(text ?? '').replace(regex, replacement)
}

export function formatRegexResult(r: { count: number; lines: string[] }): string {
  if (r.count === 0) return '无匹配结果'
  return `匹配数量: ${r.count}\n\n${r.lines.join('\n')}`
}
