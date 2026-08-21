/** GraphQL 轻量缩进美化 / 压缩 / 括号平衡 */

export const GRAPHQL_SAMPLE = [
  'query User($id: ID!) {',
  '  user(id: $id) {',
  '    id',
  '    name',
  '    email',
  '    posts(limit: 3) {',
  '      title',
  '      published',
  '    }',
  '  }',
  '}',
].join('\n')

export function checkGraphqlBalance(text: string): string[] {
  const src = String(text ?? '')
  const issues: string[] = []
  const stack: Array<{ ch: string; i: number }> = []
  const pairs: Record<string, string> = { '}': '{', ')': '(', ']': '[' }
  let i = 0
  while (i < src.length) {
    const c = src[i]!
    if (c === '#') {
      while (i < src.length && src[i] !== '\n') i++
      continue
    }
    if (c === '"') {
      if (src[i + 1] === '"' && src[i + 2] === '"') {
        i += 3
        while (i < src.length && !(src[i] === '"' && src[i + 1] === '"' && src[i + 2] === '"')) {
          if (src[i] === '\\') i += 2
          else i++
        }
        i += 3
        continue
      }
      i++
      while (i < src.length && src[i] !== '"' && src[i] !== '\n') {
        if (src[i] === '\\') i += 2
        else i++
      }
      i++
      continue
    }
    if (c === '{' || c === '(' || c === '[') stack.push({ ch: c, i })
    else if (c === '}' || c === ')' || c === ']') {
      const top = stack.pop()
      if (!top || top.ch !== pairs[c]) issues.push('括号不匹配: ' + c + ' @' + i)
    }
    i++
  }
  if (stack.length) issues.push('未闭合: ' + stack.map((s) => s.ch).join(' '))
  return issues
}

/** 跳过字符串字面量，返回结束下标 */
function skipString(src: string, start: number): number {
  let i = start
  if (src[i] === '"' && src[i + 1] === '"' && src[i + 2] === '"') {
    i += 3
    while (i < src.length && !(src[i] === '"' && src[i + 1] === '"' && src[i + 2] === '"')) {
      if (src[i] === '\\') i += 2
      else i++
    }
    return Math.min(src.length, i + 3)
  }
  i++
  while (i < src.length && src[i] !== '"' && src[i] !== '\n') {
    if (src[i] === '\\') i += 2
    else i++
  }
  return Math.min(src.length, i + 1)
}

/** 轻量分词：{ } #注释 与字段/关键字（含括号参数） */
function tokenizeGraphql(src: string): string[] {
  const tokens: string[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]!
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (c === '#') {
      let j = i
      while (j < src.length && src[j] !== '\n') j++
      tokens.push(src.slice(i, j).trimEnd())
      i = j
      continue
    }
    if (c === '{' || c === '}') {
      tokens.push(c)
      i++
      continue
    }
    let j = i
    while (j < src.length) {
      const ch = src[j]!
      if (ch === '#') break
      if (ch === '{' || ch === '}') break
      if (/\s/.test(ch)) break
      if (ch === '"') {
        j = skipString(src, j)
        continue
      }
      if (ch === '(') {
        let depth = 0
        while (j < src.length) {
          const p = src[j]!
          if (p === '"') {
            j = skipString(src, j)
            continue
          }
          if (p === '(') {
            depth++
            j++
          } else if (p === ')') {
            depth--
            j++
            if (depth === 0) break
          } else j++
        }
        continue
      }
      j++
    }
    if (j > i) tokens.push(src.slice(i, j))
    else i++
    i = Math.max(i, j)
  }
  return tokens
}

/**
 * 格式化：顶层关键字同行，选择集内字段换行缩进。
 * 不做完整 GraphQL 语法校验。
 */
export function formatGraphql(text: string, indentSize = 2): string {
  const raw = String(text ?? '').trim()
  if (!raw) throw new Error('请输入 GraphQL')
  const pad = ' '.repeat(indentSize < 1 ? 2 : indentSize)
  const tokens = tokenizeGraphql(raw.replace(/\r\n/g, '\n'))
  const lines: string[] = []
  let depth = 0
  let buf: string[] = []

  const flush = () => {
    if (!buf.length) return
    lines.push(pad.repeat(depth) + buf.join(' '))
    buf = []
  }

  for (let ti = 0; ti < tokens.length; ti++) {
    const t = tokens[ti]!
    if (t === '{') {
      buf.push('{')
      flush()
      depth++
      continue
    }
    if (t === '}') {
      flush()
      depth = Math.max(0, depth - 1)
      lines.push(pad.repeat(depth) + '}')
      continue
    }
    if (t.startsWith('#')) {
      flush()
      lines.push(pad.repeat(depth) + t)
      continue
    }
    // 选择集内：每个字段独占一行（后接 { 时与花括号同行）
    if (depth > 0 && buf.length) flush()
    buf.push(t)
    if (depth > 0 && tokens[ti + 1] !== '{') flush()
  }
  flush()
  return lines.join('\n')
}

export function minifyGraphql(text: string): string {
  return String(text ?? '')
    .replace(/#[^\n]*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}()\[\],:])\s*/g, '$1')
    .trim()
}
