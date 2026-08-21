/** Nginx 配置格式化 / 压缩 / Lint（自实现 tokenizer + AST） */

/** 允许在同一块内重复出现的指令（不同 context / 多 location 等） */
const NFM_DUP_ALLOW = new Set([
  'include',
  'access_log',
  'error_log',
  'set',
  'add_header',
  'proxy_set_header',
  'fastcgi_param',
  'expires',
  'rewrite',
  'try_files',
  'server',
  'upstream',
  'map',
  'geo',
  'if',
  'limit_except',
  'types',
  // 多个 location / server 块是常态，不应按同名指令误报
  'location',
  'listen',
])

export type NginxLintIssue = {
  line: number
  col: number
  severity: 'error' | 'warn'
  rule: string
  msg: string
  ctx: string
}

export type NginxAstNode =
  | {
      _isComment: true
      _text: string
      line: number
      col: number
    }
  | {
      _isComment?: false
      directive: string
      args: string[]
      value: string
      line: number
      col: number
      trailingComment: string | null
      isBlock: boolean
      blockKind: string | null
      children: NginxAstNode[]
    }

export type NginxBlockCounts = {
  http: number
  server: number
  location: number
  upstream: number
  if: number
  map: number
  geo: number
  limit_except: number
  events: number
  mail: number
  stream: number
  types: number
  total: number
}

type Token = { type: 'comment' | 'arg' | 'semi' | 'open' | 'close'; text: string; startCol: number }

type RawNode =
  | {
      _isComment: true
      _text: string
      _line: number
      _col: number
    }
  | {
      _isComment: false
      _isBlock: boolean
      directive: string
      _args: Array<{ text: string; col: number }>
      value: string
      _line: number
      _col: number
      _trailingComment: string | null
      _children: RawNode[]
    }

export const NFM_SAMPLE = [
  '# Nginx 示例配置',
  'worker_processes  auto;',
  'events {',
  '    worker_connections  1024;',
  '}',
  'http {',
  '    include       mime.types;',
  '    default_type  application/octet-stream;',
  '    sendfile        on;',
  '    keepalive_timeout  65;',
  '    upstream backend {',
  '        server 127.0.0.1:8080;',
  '        server 127.0.0.1:8081;',
  '    }',
  '    server {',
  '        listen       80;',
  '        server_name  example.com;',
  '        location /api/ {',
  '            proxy_pass http://backend;',
  '        }',
  '        location ~ \\.php$ {',
  '            fastcgi_pass unix:/var/run/php-fpm.sock;',
  '        }',
  '    }',
  '}',
].join('\n')

function skipString(text: string, start: number): number {
  const q = text[start]
  if (q !== '"' && q !== "'") return start + 1
  let i = start + 1
  const n = text.length
  while (i < n) {
    const ch = text[i]
    if (ch === '\\' && i + 1 < n) {
      i += 2
      continue
    }
    if (ch === q) return i + 1
    i++
  }
  return n
}

function joinBackslashLines(text: string): Array<{ line: string; startLine: number }> {
  const srcLines = String(text || '').split(/\r?\n/)
  const out: Array<{ line: string; startLine: number }> = []
  let buf = ''
  let bufStart = 1
  for (let i = 0; i < srcLines.length; i++) {
    const ln = srcLines[i]!
    if (buf === '') bufStart = i + 1
    if (buf !== '') buf += ' '
    buf += ln
    let end = buf.length
    while (end > 0 && (buf[end - 1] === ' ' || buf[end - 1] === '\t')) end--
    if (end > 0 && buf[end - 1] === '\\') {
      let cut = end - 1
      while (cut > 0 && (buf[cut - 1] === ' ' || buf[cut - 1] === '\t')) cut--
      buf = buf.slice(0, cut)
      continue
    }
    out.push({ line: buf, startLine: bufStart })
    buf = ''
  }
  if (buf !== '') out.push({ line: buf, startLine: bufStart })
  return out
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const n = line.length

  while (i < n && (line[i] === ' ' || line[i] === '\t')) i++
  if (i < n && line[i] === '#') {
    tokens.push({ type: 'comment', text: line.slice(i), startCol: i + 1 })
    return tokens
  }

  while (i < n) {
    const c = line[i]!
    if (c === ' ' || c === '\t') {
      i++
      continue
    }
    if (c === '#') {
      tokens.push({ type: 'comment', text: line.slice(i), startCol: i + 1 })
      return tokens
    }
    if (c === '"' || c === "'") {
      const end = skipString(line, i)
      tokens.push({ type: 'arg', text: line.slice(i, end), startCol: i + 1 })
      i = end
      continue
    }
    if (c === ';') {
      tokens.push({ type: 'semi', text: ';', startCol: i + 1 })
      i++
      continue
    }
    if (c === '{') {
      tokens.push({ type: 'open', text: '{', startCol: i + 1 })
      i++
      continue
    }
    if (c === '}') {
      tokens.push({ type: 'close', text: '}', startCol: i + 1 })
      i++
      continue
    }
    const start = i
    while (
      i < n &&
      line[i] !== ' ' &&
      line[i] !== '\t' &&
      line[i] !== ';' &&
      line[i] !== '{' &&
      line[i] !== '}' &&
      line[i] !== '#'
    ) {
      if (line[i] === '"' || line[i] === "'") {
        i = skipString(line, i)
        continue
      }
      i++
    }
    const txt = line.slice(start, i)
    if (!txt) {
      i++
      continue
    }
    tokens.push({ type: 'arg', text: txt, startCol: start + 1 })
  }
  return tokens
}

function finalizeNode(node: RawNode): NginxAstNode {
  if (node._isComment) {
    return {
      _isComment: true,
      _text: node._text,
      line: node._line,
      col: node._col,
    }
  }
  const out: NginxAstNode = {
    directive: node.directive,
    args: (node._args || []).map((a) => a.text),
    value: node.value || '',
    line: node._line,
    col: node._col,
    trailingComment: node._trailingComment || null,
    isBlock: node._isBlock === true,
    blockKind: node._isBlock === true ? node.directive : null,
    children: [],
  }
  if (out.isBlock) {
    for (let i = 0; i < (node._children || []).length; i++) {
      out.children.push(finalizeNode(node._children[i]!))
    }
  }
  return out
}

export function parseNginx(text: string): NginxAstNode[] {
  const logicalLines = joinBackslashLines(text)
  const items: RawNode[] = []
  const stack: Array<{ _nodes: RawNode[]; _parent?: RawNode }> = [{ _nodes: items }]

  for (let li = 0; li < logicalLines.length; li++) {
    const { line, startLine } = logicalLines[li]!
    const tokens = tokenizeLine(line)
    if (tokens.length === 0) continue

    if (tokens.length === 1 && tokens[0]!.type === 'comment') {
      const top = stack[stack.length - 1]!
      top._nodes.push({
        _isComment: true,
        _text: tokens[0]!.text,
        _line: startLine,
        _col: tokens[0]!.startCol,
      })
      continue
    }

    let idx = 0
    let pendingComment: Token | null = null
    while (idx < tokens.length) {
      const tk = tokens[idx]!
      if (tk.type === 'close') {
        if (stack.length > 1) stack.pop()
        idx++
        continue
      }
      if (tk.type === 'comment') {
        pendingComment = tk
        idx++
        if (idx < tokens.length && tokens[idx]!.type !== 'close') break
        continue
      }
      if (tk.type === 'semi') {
        idx++
        continue
      }

      let directive: string | null = null
      const args: Array<{ text: string; col: number }> = []
      let directiveCol = -1
      let braceCol = -1
      let trailingComment = pendingComment
      let hadSemi = false
      pendingComment = null

      while (idx < tokens.length) {
        const t = tokens[idx]!
        if (t.type === 'close') break
        if (t.type === 'comment') {
          trailingComment = t
          idx++
          break
        }
        if (!directive) {
          directive = t.text
          directiveCol = t.startCol
          idx++
          continue
        }
        if (t.type === 'semi') {
          hadSemi = true
          idx++
          if (idx < tokens.length && tokens[idx]!.type === 'comment') {
            trailingComment = tokens[idx]!
            idx++
          }
          break
        }
        if (t.type === 'open') {
          braceCol = t.startCol
          idx++
          break
        }
        args.push({ text: t.text, col: t.startCol })
        idx++
      }

      if (!directive) break

      const top = stack[stack.length - 1]!
      const node: RawNode = {
        _isBlock: braceCol >= 0,
        _isComment: false,
        directive,
        _args: args,
        value: args.map((a) => a.text).join(' '),
        _line: startLine,
        _col: directiveCol,
        _trailingComment: trailingComment ? trailingComment.text : null,
        _children: [],
      }
      top._nodes.push(node)

      if (braceCol >= 0) {
        stack.push({
          _nodes: node._children,
          _parent: node,
        })
      }

      while (idx < tokens.length && tokens[idx]!.type === 'close') {
        if (stack.length > 1) stack.pop()
        idx++
      }

      if (!hadSemi && braceCol < 0) break
      if (idx >= tokens.length) break
      while (idx < tokens.length && tokens[idx]!.type === 'comment') {
        pendingComment = tokens[idx]!
        idx++
      }
      if (idx >= tokens.length) break
      if (tokens[idx]!.type === 'close') continue
    }
  }

  return items.map(finalizeNode)
}

function renderAst(items: NginxAstNode[], indent: string, depth: number): string[] {
  const lines: string[] = []
  const prefix = indent.repeat(depth)
  for (let i = 0; i < items.length; i++) {
    const node = items[i]!
    if (node._isComment) {
      const t = node._text.replace(/^\s+/, '')
      lines.push(prefix + t)
      continue
    }
    const head = node.directive + (node.value ? ' ' + node.value : '')
    if (node.isBlock) {
      lines.push(prefix + head + ' {')
      const childLines = renderAst(node.children, indent, depth + 1)
      for (let j = 0; j < childLines.length; j++) lines.push(childLines[j]!)
      lines.push(prefix + '}')
    } else {
      const tail = node.trailingComment ? ' ' + node.trailingComment : ''
      lines.push(prefix + head + ';' + tail)
    }
  }
  return lines
}

export function formatNginx(text: string, opts?: { indent?: string } | number): string {
  const raw = String(text ?? '')
  if (!raw.trim()) throw new Error('请输入 Nginx 配置')

  const braceErr = (() => {
    const srcLines = raw.split(/\r?\n/)
    let openCount = 0
    let closeCount = 0
    for (let i = 0; i < srcLines.length; i++) {
      const masked = maskStringsAndComments(srcLines[i]!)
      for (let j = 0; j < masked.length; j++) {
        if (masked[j] === '{') openCount++
        else if (masked[j] === '}') closeCount++
      }
    }
    if (openCount !== closeCount) {
      return '大括号不平衡: ' + openCount + ' 个 { / ' + closeCount + ' 个 }'
    }
    return null
  })()
  if (braceErr) throw new Error(braceErr)

  let indent = '    '
  if (typeof opts === 'number') {
    indent = opts < 0 ? '  ' : ' '.repeat(opts)
  } else if (opts?.indent != null) {
    indent = opts.indent
  }
  const items = parseNginx(text)
  return renderAst(items, indent, 0).join('\n')
}

/**
 * 真压缩：去掉注释与多余空白，产出紧凑单行（块结构拼接为 head{...}）。
 * 括号不平衡时抛错。
 */
export function minifyNginx(text: string): string {
  const raw = String(text ?? '')
  if (!raw.trim()) throw new Error('请输入 Nginx 配置')

  // 先检查括号
  const braceIssues = lintNginxBraceOnly(raw)
  if (braceIssues) throw new Error(braceIssues)

  const items = parseNginx(raw)
  return renderMinified(items)
}

/** 仅检查大括号平衡，返回错误文案或 null */
function lintNginxBraceOnly(text: string): string | null {
  const srcLines = String(text).split(/\r?\n/)
  let openCount = 0
  let closeCount = 0
  for (let i = 0; i < srcLines.length; i++) {
    const masked = maskStringsAndComments(srcLines[i]!)
    for (let j = 0; j < masked.length; j++) {
      if (masked[j] === '{') openCount++
      else if (masked[j] === '}') closeCount++
    }
  }
  if (openCount !== closeCount) {
    return '大括号不平衡: ' + openCount + ' 个 { / ' + closeCount + ' 个 }'
  }
  return null
}

/** 紧凑渲染：指令间空格分隔，块用 {\\n ... \\n} 保留最少换行 */
function renderMinified(items: NginxAstNode[]): string {
  const parts: string[] = []
  for (let i = 0; i < items.length; i++) {
    const node = items[i]!
    if (node._isComment) continue
    const head = node.directive + (node.value ? ' ' + node.value : '')
    if (node.isBlock) {
      const inner = renderMinified(node.children)
      if (inner) parts.push(head + '{' + inner + '}')
      else parts.push(head + '{}')
    } else {
      parts.push(head + ';')
    }
  }
  // 真压缩：指令紧挨拼接为单行（块为 head{inner}）
  return parts.join('')
}

function maskStringsAndComments(line: string): string {
  const n = line.length
  let i = 0
  let out = ''
  while (i < n) {
    const c = line[i]!
    if (c === '"' || c === "'") {
      const end = skipString(line, i)
      for (let k = i; k < end; k++) out += line[k] === '\n' ? '\n' : ' '
      i = end
      continue
    }
    if (c === '#') {
      for (let k = i; k < n; k++) out += ' '
      return out
    }
    out += c
    i++
  }
  return out
}

function lintDup(nodes: NginxAstNode[], srcLines: string[], result: NginxLintIssue[]) {
  const seen: Record<string, NginxAstNode[]> = {}
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!
    if (node._isComment) continue
    const key = node.directive
    if (!seen[key]) seen[key] = [node]
    else seen[key]!.push(node)
  }
  for (const key in seen) {
    const list = seen[key]!
    if (list.length > 1 && !NFM_DUP_ALLOW.has(key)) {
      for (let i = 1; i < list.length; i++) {
        const n = list[i]!
        if (n._isComment) continue
        result.push({
          line: n.line,
          col: n.col,
          severity: 'warn',
          rule: 'duplicate-directive',
          msg: '同一块内重复指令: ' + key,
          ctx: (srcLines[n.line - 1] || '').trim(),
        })
      }
    }
  }
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!
    if (!node._isComment && node.isBlock && node.children) {
      lintDup(node.children, srcLines, result)
    }
  }
}

export function lintNginx(text: string): NginxLintIssue[] {
  const result: NginxLintIssue[] = []
  if (text == null) return result
  const srcLines = String(text).split(/\r?\n/)

  try {
    const ast = parseNginx(text)
    lintDup(ast, srcLines, result)
  } catch {
    // 解析失败时不阻塞其他规则
  }

  let openCount = 0
  let closeCount = 0
  for (let i = 0; i < srcLines.length; i++) {
    const raw = srcLines[i]!
    const lineNo = i + 1
    const masked = maskStringsAndComments(raw)
    for (let j = 0; j < masked.length; j++) {
      if (masked[j] === '{') openCount++
      else if (masked[j] === '}') closeCount++
    }
    if (masked.trim() === '') continue
    if (masked.trim().startsWith('#')) continue
    const trimmed = masked.trim()
    if (trimmed === '}') continue
    if (trimmed.endsWith('{')) continue
    if (!/[;{]/.test(trimmed)) {
      result.push({
        line: lineNo,
        col: trimmed.length,
        severity: 'warn',
        rule: 'missing-semicolon',
        msg: '指令缺少结尾分号 ;',
        ctx: raw.trim(),
      })
    }
  }

  if (openCount !== closeCount) {
    result.push({
      line: 0,
      col: 0,
      severity: 'error',
      rule: 'unbalanced-brace',
      msg: '大括号不平衡: ' + openCount + ' 个 { / ' + closeCount + ' 个 }',
      ctx: '',
    })
  }

  result.sort((a, b) => {
    if (a.line !== b.line) return a.line - b.line
    return a.col - b.col
  })
  return result
}

export function countBlocks(text: string): NginxBlockCounts {
  const ast = parseNginx(text)
  const counts: NginxBlockCounts = {
    http: 0,
    server: 0,
    location: 0,
    upstream: 0,
    if: 0,
    map: 0,
    geo: 0,
    limit_except: 0,
    events: 0,
    mail: 0,
    stream: 0,
    types: 0,
    total: 0,
  }

  function walk(nodes: NginxAstNode[]) {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]!
      if (n._isComment) continue
      if (n.isBlock) {
        counts.total++
        if ((counts as Record<string, number>)[n.directive] != null) {
          ;(counts as Record<string, number>)[n.directive]!++
        }
        walk(n.children)
      }
    }
  }

  walk(ast)
  return counts
}

export function formatBlockStats(text: string): string {
  if (!String(text || '').trim()) return ''
  try {
    const c = countBlocks(text)
    const parts: string[] = []
    if (c.http) parts.push('http ×' + c.http)
    if (c.server) parts.push('server ×' + c.server)
    if (c.location) parts.push('location ×' + c.location)
    if (c.upstream) parts.push('upstream ×' + c.upstream)
    if (c.if) parts.push('if ×' + c.if)
    parts.push('块总计 ×' + c.total)
    return parts.join(' · ')
  } catch {
    return ''
  }
}
