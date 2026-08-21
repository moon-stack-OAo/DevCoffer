export type JavaBraceStyle = 'kr' | 'allman'

export type FormatJavaOptions = {
  indent?: string
  brace?: JavaBraceStyle
  sortImports?: boolean
  chainBreak?: boolean
  annotationBreak?: boolean
  compress?: boolean
}

type JfTokenType = 'linecmt' | 'blkcmt' | 'str' | 'char' | 'tpl' | 'code'

type JfToken = {
  type: JfTokenType
  text: string
  start: number
  end: number
}

type JfBrace = { type: 'open' | 'close'; pos: number }

function jfTokenize(code: string, start = 0, end: number = code.length): JfToken[] {
  const tokens: JfToken[] = []
  let i = start
  while (i < end) {
    const c = code[i]

    if (c === '/' && code[i + 1] === '/') {
      const s = i
      while (i < end && code[i] !== '\n') i++
      tokens.push({ type: 'linecmt', text: code.slice(s, i), start: s, end: i })
      continue
    }
    if (c === '/' && code[i + 1] === '*') {
      const s = i
      i += 2
      while (i < end) {
        if (code[i] === '*' && code[i + 1] === '/') {
          i += 2
          break
        }
        i++
      }
      tokens.push({ type: 'blkcmt', text: code.slice(s, i), start: s, end: i })
      continue
    }
    if (c === '"') {
      const s = i
      i++
      while (i < end) {
        if (code[i] === '\\') {
          i += 2
          continue
        }
        if (code[i] === '"') {
          i++
          break
        }
        if (code[i] === '\n') break
        i++
      }
      tokens.push({ type: 'str', text: code.slice(s, i), start: s, end: i })
      continue
    }
    if (c === "'") {
      const s = i
      i++
      while (i < end) {
        if (code[i] === '\\') {
          i += 2
          continue
        }
        if (code[i] === "'") {
          i++
          break
        }
        if (code[i] === '\n') break
        i++
      }
      tokens.push({ type: 'char', text: code.slice(s, i), start: s, end: i })
      continue
    }
    if (c === '`') {
      const tplStart = i
      i++
      let fragStart = tplStart + 1
      let broken = false
      while (i < end) {
        if (code[i] === '`') {
          if (i > fragStart) {
            tokens.push({
              type: 'tpl',
              text: code.slice(fragStart, i),
              start: fragStart,
              end: i,
            })
          }
          i++
          broken = true
          break
        }
        if (code[i] === '\\') {
          i += 2
          continue
        }
        if (code[i] === '$' && code[i + 1] === '{') {
          if (i > fragStart) {
            tokens.push({
              type: 'tpl',
              text: code.slice(fragStart, i),
              start: fragStart,
              end: i,
            })
          }
          tokens.push({ type: 'code', text: '${', start: i, end: i + 2 })
          i += 2
          const exprStart = i
          let depth = 1
          while (i < end && depth > 0) {
            const ch = code[i]
            if (ch === '{') {
              depth++
              i++
              continue
            }
            if (ch === '}') {
              depth--
              if (depth === 0) break
              i++
              continue
            }
            if (ch === '"' || ch === "'") {
              const q = ch
              i++
              while (i < end) {
                if (code[i] === '\\') {
                  i += 2
                  continue
                }
                if (code[i] === q) {
                  i++
                  break
                }
                if (code[i] === '\n') break
                i++
              }
              continue
            }
            if (ch === '`') {
              i++
              while (i < end && code[i] !== '`') {
                if (code[i] === '\\') {
                  i += 2
                  continue
                }
                i++
              }
              if (i < end) i++
              continue
            }
            if (ch === '/' && code[i + 1] === '/') {
              while (i < end && code[i] !== '\n') i++
              continue
            }
            if (ch === '/' && code[i + 1] === '*') {
              i += 2
              while (i < end) {
                if (code[i] === '*' && code[i + 1] === '/') {
                  i += 2
                  break
                }
                i++
              }
              continue
            }
            i++
          }
          const exprEnd = i
          const inner = jfTokenize(code, exprStart, exprEnd)
          tokens.push(...inner)
          tokens.push({
            type: 'code',
            text: '}',
            start: exprEnd,
            end: exprEnd + 1,
          })
          i = exprEnd + 1
          fragStart = i
          continue
        }
        i++
      }
      if (!broken) {
        if (i > fragStart) {
          tokens.push({
            type: 'tpl',
            text: code.slice(fragStart, i),
            start: fragStart,
            end: i,
          })
        }
      }
      continue
    }

    const s = i
    while (i < end) {
      const ch = code[i]
      if (ch === '/' && (code[i + 1] === '/' || code[i + 1] === '*')) break
      if (ch === '"' || ch === "'" || ch === '`') break
      i++
    }
    tokens.push({ type: 'code', text: code.slice(s, i), start: s, end: i })
  }
  return tokens
}

function jfScanBraces(line: string): JfBrace[] {
  const tokens = jfTokenize(line)
  const out: JfBrace[] = []
  for (const t of tokens) {
    if (t.type !== 'code') continue
    for (let i = 0; i < t.text.length; i++) {
      if (t.text[i] === '{') out.push({ type: 'open', pos: t.start + i })
      else if (t.text[i] === '}') out.push({ type: 'close', pos: t.start + i })
    }
  }
  return out
}

function jfPreprocessBraces(text: string, braceStyle: JavaBraceStyle): string {
  const tokens = jfTokenize(text)
  const buf: string[] = []
  let cursor = 0
  const len = text.length

  function pushTo(upto: number) {
    if (upto > cursor) {
      buf.push(text.slice(cursor, upto))
      cursor = upto
    }
  }

  function prevSig(pos: number): string {
    let p = pos - 1
    while (p >= 0 && text[p] !== '\n' && /\s/.test(text[p]!)) p--
    if (p < 0) return ''
    return text[p]!
  }

  function nextSig(pos: number): string {
    let n = pos + 1
    while (n < len && text[n] !== '\n' && /\s/.test(text[n]!)) n++
    if (n >= len) return ''
    return text[n]!
  }

  for (const t of tokens) {
    if (t.type !== 'code') {
      pushTo(t.start)
      buf.push(t.text)
      cursor = t.end
      continue
    }
    for (let i = 0; i < t.text.length; i++) {
      const c = t.text[i]
      if (c !== '{' && c !== '}') continue
      const absPos = t.start + i

      if (c === '{') {
        if (braceStyle === 'allman') {
          const prev = prevSig(absPos)
          if (prev && prev !== '\n') {
            pushTo(absPos)
            buf.push('\n')
          }
        }
        pushTo(absPos + 1)
        const next = nextSig(absPos)
        if (next && next !== '\n') {
          buf.push('\n')
        }
      } else {
        const prev = prevSig(absPos)
        const next = nextSig(absPos)
        const isEmpty = prev === '{'
        const isLeadingKeyword = !!(next && /[A-Za-z_]/.test(next))
        if (prev && prev !== '\n' && !isEmpty && !isLeadingKeyword) {
          pushTo(absPos)
          buf.push('\n')
        }
        pushTo(absPos + 1)
      }
    }
    pushTo(t.end)
  }
  return buf.join('')
}

function jfSortImportBlock(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []
  let i = 0
  while (i < lines.length) {
    if (/^\s*import\s+/.test(lines[i]!)) {
      const blockLines: string[] = []
      while (i < lines.length && /^\s*import\s+/.test(lines[i]!)) {
        blockLines.push(lines[i]!.trim())
        i++
      }
      const groups: { java: string[]; javax: string[]; other: string[] } = {
        java: [],
        javax: [],
        other: [],
      }
      for (const imp of blockLines) {
        const m = imp.match(/^import\s+(.+?);$/)
        if (!m) {
          groups.other.push(imp)
          continue
        }
        const fqcn = m[1]!.trim().replace(/^static\s+/, '')
        if (fqcn.startsWith('javax.')) groups.javax.push(imp)
        else if (fqcn.startsWith('java.')) groups.java.push(imp)
        else groups.other.push(imp)
      }
      groups.java.sort()
      groups.javax.sort()
      groups.other.sort()
      const emitted: string[] = []
      if (groups.java.length) emitted.push(...groups.java)
      if (groups.javax.length) {
        if (emitted.length) emitted.push('')
        emitted.push(...groups.javax)
      }
      if (groups.other.length) {
        if (emitted.length) emitted.push('')
        emitted.push(...groups.other)
      }
      result.push(...emitted)
    } else {
      result.push(lines[i]!)
      i++
    }
  }
  return result.join('\n')
}

function jfAnnotationBreakLine(line: string): string[] {
  const tokens = jfTokenize(line)
  const annots: { atPos: number; idEnd: number }[] = []
  for (const t of tokens) {
    if (t.type !== 'code') continue
    for (let i = 0; i < t.text.length; i++) {
      if (t.text[i] !== '@') continue
      const prev = i > 0 ? t.text[i - 1]! : ''
      if (prev !== '' && !/[\s,;(]/.test(prev)) continue
      let j = i + 1
      while (j < t.text.length && /[\w.]/.test(t.text[j]!)) j++
      if (j === i + 1) continue
      annots.push({ atPos: t.start + i, idEnd: t.start + j })
    }
  }
  if (annots.length < 3) return [line]

  const expanded = annots.map((a) => {
    let e = a.idEnd
    while (e < line.length && /\s/.test(line[e]!)) e++
    if (line[e] === '(') {
      let depth = 1
      let k = e + 1
      while (k < line.length && depth > 0) {
        const c = line[k]!
        if (c === '(' || c === '[' || c === '{') depth++
        else if (c === ')' || c === ']' || c === '}') depth--
        else if (c === '"' || c === "'") {
          const q = c
          k++
          while (k < line.length && line[k] !== q) {
            if (line[k] === '\\') k++
            k++
          }
          continue
        }
        k++
      }
      e = k
    }
    return { start: a.atPos, end: e }
  })

  const out: string[] = []
  const prefix = line.slice(0, annots[0]!.atPos).replace(/\s+$/, '')
  if (prefix) out.push(prefix)
  for (const x of expanded) {
    const seg = line.slice(x.start, x.end).replace(/\s+$/, '')
    if (seg) out.push(seg)
  }
  const suffix = line.slice(expanded[expanded.length - 1]!.end)
  if (suffix.trim()) out.push(suffix.replace(/^\s+/, ''))
  return out
}

function jfAnnotationBreakTransform(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []
  for (const ln of lines) {
    out.push(...jfAnnotationBreakLine(ln))
  }
  return out.join('\n')
}

function jfChainBreakLine(line: string): string[] {
  const tokens = jfTokenize(line)
  const positions: { dotPos: number; idEnd: number }[] = []
  for (const t of tokens) {
    if (t.type !== 'code') continue
    for (let i = 0; i < t.text.length; i++) {
      if (t.text[i] !== '.') continue
      const prev = i > 0 ? t.text[i - 1]! : ''
      if (prev === '' || /[\s([{,;:]/.test(prev)) continue
      let j = i + 1
      while (j < t.text.length && /[\w]/.test(t.text[j]!)) j++
      if (j === i + 1) continue
      let k = j
      while (k < t.text.length && /\s/.test(t.text[k]!)) k++
      if (line[t.start + k] !== '(') continue
      positions.push({ dotPos: t.start + i, idEnd: t.start + j })
    }
  }
  if (positions.length < 2) return [line]

  const segments = positions.map((p) => {
    let e = p.idEnd
    while (e < line.length && /\s/.test(line[e]!)) e++
    if (line[e] === '(') {
      let depth = 1
      let k = e + 1
      while (k < line.length && depth > 0) {
        const c = line[k]!
        if (c === '(' || c === '[' || c === '{') depth++
        else if (c === ')' || c === ']' || c === '}') depth--
        else if (c === '"' || c === "'") {
          const q = c
          k++
          while (k < line.length && line[k] !== q) {
            if (line[k] === '\\') k++
            k++
          }
          continue
        }
        k++
      }
      e = k
    }
    return { start: p.dotPos, end: e }
  })

  const out: string[] = []
  const prefix = line.slice(0, positions[0]!.dotPos).replace(/\s+$/, '')
  if (prefix) out.push(prefix)
  const lastSegIdx = segments.length - 1
  for (let i = 0; i < segments.length; i++) {
    let seg = line.slice(segments[i]!.start, segments[i]!.end)
    if (i === lastSegIdx) {
      const suffix = line.slice(segments[i]!.end)
      seg += suffix
    }
    seg = seg.replace(/\s+$/, '')
    if (seg) out.push(seg)
  }
  return out
}

function jfChainBreakTransform(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []
  for (const ln of lines) {
    out.push(...jfChainBreakLine(ln))
  }
  return out.join('\n')
}

function jfReindent(text: string, indentStr: string): string {
  const lines = text.split('\n')
  const out: string[] = []
  let depth = 0
  for (const line of lines) {
    const trimmed = line.replace(/\s+$/, '')
    if (!trimmed.trim()) {
      out.push('')
      continue
    }
    const braces = jfScanBraces(trimmed)
    let oc = 0
    let cc = 0
    for (const b of braces) {
      if (b.type === 'open') oc++
      else cc++
    }
    const startsClose = braces.length > 0 && braces[0]!.type === 'close'

    let lineDepth = depth
    if (startsClose) lineDepth = depth - 1

    out.push(indentStr.repeat(Math.max(lineDepth, 0)) + trimmed.trim())

    depth = Math.max(0, depth + (oc - cc))
  }
  return out.join('\n')
}

/** 判断是否标识符/关键字字符 */
function jfIsIdentChar(ch: string | undefined): boolean {
  return !!ch && /[A-Za-z0-9_$]/.test(ch)
}

/**
 * 压缩代码段空白：去掉多余空格，但保留关键字与标识符之间的必要空格，
 * 避免 `packagecom.example` / `publicclass` 这类粘连。
 */
function jfCompressCodeSegment(text: string): string {
  let out = ''
  let i = 0
  const n = text.length
  while (i < n) {
    const ch = text[i]!
    if (/\s/.test(ch)) {
      let j = i + 1
      while (j < n && /\s/.test(text[j]!)) j++
      const prev = out.length ? out[out.length - 1] : ''
      const next = text[j]
      // 两侧都是标识符字符时必须保留一个空格
      if (jfIsIdentChar(prev) && jfIsIdentChar(next)) {
        out += ' '
      }
      i = j
      continue
    }
    out += ch
    i++
  }
  return out
}

function jfCompressLine(line: string): string {
  const tokens = jfTokenize(line)
  let s = ''
  for (const t of tokens) {
    if (t.type === 'code') {
      s += jfCompressCodeSegment(t.text)
    } else {
      // 字符串 / 注释等原样保留
      s += t.text
    }
  }
  return s
}

function jfCompressJava(code: string): string {
  const text = (code || '').replace(/\r\n?/g, '\n')
  const lines = text.split('\n')
  const out: string[] = []
  for (const raw of lines) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    // 行注释单独成行时跳过（压缩目标是可执行代码体积）
    if (trimmed.startsWith('//')) continue
    out.push(jfCompressLine(trimmed))
  }
  // 行之间若两侧是标识符，插入空格；否则直接拼接
  let result = ''
  for (const part of out) {
    if (!part) continue
    if (!result) {
      result = part
      continue
    }
    const prev = result[result.length - 1]
    const next = part[0]
    if (jfIsIdentChar(prev) && jfIsIdentChar(next)) result += ' '
    result += part
  }
  return result
}

export function formatJava(code: string | null | undefined, opts: FormatJavaOptions = {}): string {
  const indentStr = opts.indent != null ? opts.indent : '    '
  const braceStyle: JavaBraceStyle = opts.brace || 'kr'

  if (code == null) return ''
  const raw = String(code)
  if (!raw.trim()) return raw

  if (opts.compress) {
    return jfCompressJava(raw)
  }

  let text = raw.replace(/\r\n?/g, '\n')

  if (opts.sortImports) text = jfSortImportBlock(text)
  if (opts.annotationBreak) text = jfAnnotationBreakTransform(text)
  if (opts.chainBreak) text = jfChainBreakTransform(text)

  text = jfPreprocessBraces(text, braceStyle)
  return jfReindent(text, indentStr)
}

export function javaFormatLite(src: string): string {
  return formatJava(src, { indent: '  ', brace: 'kr' })
}

export const JAVA_FMT_SAMPLE =
  'package com.example;\n' +
  'import java.util.*;\n' +
  'import javax.annotation.Nullable;\n' +
  'import static java.util.stream.Collectors.toList;\n' +
  'import com.example.repo.UserRepo;\n' +
  '\n' +
  'class ActiveUserService {\n' +
  '    @Override @Deprecated @SuppressWarnings("all") public List<String> activeNames(long uid) {\n' +
  '        User u = repo.find(uid);\n' +
  '        if (u == null) return Collections.emptyList();\n' +
  '        return u.getRoles().stream().filter(r -> r.isActive()).map(r -> r.getName()).collect(toList());\n' +
  '    }\n' +
  '}\n' +
  '\n' +
  'class Inner {\n' +
  '    void m() {\n' +
  '        String s = "hello{world}";\n' +
  '        if (true) {\n' +
  '            System.out.println("brace inside string {" + s + "}");\n' +
  '        }\n' +
  '    }\n' +
  '}\n'
