/** HTML 简易缩进美化（字符串级，非完整解析器） */

export function formatHtml(input: string, indentSize = 2): string {
  const src = String(input || '').trim()
  if (!src) return ''
  const voidTags = new Set([
    'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr',
  ])
  // 在标签间插入换行
  const flat = src
    .replace(/>\s+</g, '><')
    .replace(/</g, '\n<')
    .replace(/>/g, '>\n')
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)

  const pad = (n: number) => ' '.repeat(Math.max(0, n) * indentSize)
  let depth = 0
  const out: string[] = []
  for (const line of flat) {
    const isClose = /^<\//.test(line)
    const isComment = /^<!--/.test(line) || /^<!DOCTYPE/i.test(line)
    const tagMatch = line.match(/^<\/?([a-zA-Z0-9:-]+)/)
    const tag = tagMatch?.[1]?.toLowerCase() || ''
    const isVoid = voidTags.has(tag) || /\/>$/.test(line)
    const isOpen = /^<[a-zA-Z]/.test(line) && !isVoid && !isComment

    if (isClose) depth = Math.max(0, depth - 1)
    out.push(pad(depth) + line)
    if (isOpen) depth += 1
  }
  return out.join('\n')
}
