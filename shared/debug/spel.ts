/** SpEL 速查分析 + 简易子集试算（对齐旧站 evalSimpleSpel） */

export function spelAnalyze(expr: string): string {
  const s = String(expr || '')
  if (!s.trim()) throw new Error('请输入 SpEL')
  const lines: string[] = []
  let depth = 0
  let max = 0
  for (const ch of s) {
    if (ch === '(' || ch === '{' || ch === '[') {
      depth++
      max = Math.max(max, depth)
    } else if (ch === ')' || ch === '}' || ch === ']') depth--
  }
  lines.push('括号深度峰值: ' + max)
  lines.push('括号是否大致平衡: ' + (depth === 0 ? '是' : '否（差值 ' + depth + '）'))
  const vars = Array.from(new Set(s.match(/#[A-Za-z_][\w]*/g) || []))
  const props = Array.from(new Set(s.match(/\b[A-Za-z_][\w]*\s*\./g) || [])).map((x) =>
    x.replace(/\s*\./, ''),
  )
  lines.push('变量: ' + (vars.join(', ') || '(无)'))
  lines.push('属性访问线索: ' + (props.slice(0, 20).join(', ') || '(无)'))
  if (/T\([A-Za-z0-9_.]+\)/.test(s)) lines.push('检测到 T(Type) 静态类型引用')
  if (/\?\.|\?:|\?\[/.test(s)) lines.push('检测到安全导航 / Elvis')
  lines.push('', '高亮（简易）:')
  lines.push(
    s
      .replace(/(#[A-Za-z_][\w]*)/g, '«$1»')
      .replace(/\b(and|or|not|matches|instanceof|new|T)\b/gi, '[$1]'),
  )
  return lines.join('\n')
}

class SpelSimpleParser {
  input: string
  pos = 0
  context: Record<string, unknown>

  constructor(input: string, context: Record<string, unknown>) {
    this.input = input
    this.context = context
  }

  eof() {
    return this.pos >= this.input.length
  }
  rest() {
    return this.input.slice(this.pos)
  }
  peek() {
    return this.input[this.pos]
  }
  skipWs() {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos]!)) this.pos++
  }
  match(s: string) {
    this.skipWs()
    if (this.input.slice(this.pos, this.pos + s.length) === s) {
      this.pos += s.length
      return true
    }
    return false
  }
  expect(s: string) {
    if (!this.match(s)) throw new Error('期望 "' + s + '"，位置 ' + this.pos)
  }

  parseExpression(): unknown {
    return this.parseTernary()
  }

  parseTernary(): unknown {
    const cond = this.parseOr()
    this.skipWs()
    if (this.match('?')) {
      const whenTrue = this.parseExpression()
      this.expect(':')
      const whenFalse = this.parseExpression()
      return cond ? whenTrue : whenFalse
    }
    return cond
  }

  parseOr(): unknown {
    let left: unknown = this.parseAnd()
    for (;;) {
      this.skipWs()
      if (this.match('||') || this.match('or') || this.match('OR')) {
        const right = this.parseAnd()
        left = !!(left || right)
      } else break
    }
    return left
  }

  parseAnd(): unknown {
    let left: unknown = this.parseEquality()
    for (;;) {
      this.skipWs()
      if (this.match('&&') || this.match('and') || this.match('AND')) {
        const right = this.parseEquality()
        left = !!(left && right)
      } else break
    }
    return left
  }

  parseEquality(): unknown {
    let left: unknown = this.parseComparison()
    for (;;) {
      this.skipWs()
      if (this.match('==') || this.match('eq') || this.match('EQ')) {
        left = left === this.parseComparison()
      } else if (this.match('!=') || this.match('ne') || this.match('NE')) {
        left = left !== this.parseComparison()
      } else break
    }
    return left
  }

  parseComparison(): unknown {
    let left: any = this.parseAdd()
    for (;;) {
      this.skipWs()
      if (this.match('>=') || this.match('ge') || this.match('GE')) left = left >= (this.parseAdd() as any)
      else if (this.match('<=') || this.match('le') || this.match('LE')) left = left <= (this.parseAdd() as any)
      else if (this.match('>') || this.match('gt') || this.match('GT')) left = left > (this.parseAdd() as any)
      else if (this.match('<') || this.match('lt') || this.match('LT')) left = left < (this.parseAdd() as any)
      else break
    }
    return left
  }

  parseAdd(): unknown {
    let left: any = this.parseMul()
    for (;;) {
      this.skipWs()
      if (this.match('+')) {
        const right: any = this.parseMul()
        left =
          typeof left === 'string' || typeof right === 'string'
            ? String(left) + String(right)
            : left + right
      } else if (this.match('-')) {
        left = left - (this.parseMul() as any)
      } else break
    }
    return left
  }

  parseMul(): unknown {
    let left: any = this.parseUnary()
    for (;;) {
      this.skipWs()
      if (this.match('*')) left = left * (this.parseUnary() as any)
      else if (this.match('/')) left = left / (this.parseUnary() as any)
      else if (this.match('%')) left = left % (this.parseUnary() as any)
      else break
    }
    return left
  }

  parseUnary(): unknown {
    this.skipWs()
    if (this.match('!') || this.match('not') || this.match('NOT')) return !this.parseUnary()
    if (this.match('-')) return -(this.parseUnary() as any)
    if (this.match('+')) return +(this.parseUnary() as any)
    return this.parsePrimary()
  }

  parsePrimary(): unknown {
    this.skipWs()
    if (this.eof()) throw new Error('意外的表达式结束')
    if (this.match('(')) {
      const v = this.parseExpression()
      this.expect(')')
      return v
    }
    const ch = this.peek()
    if (ch === "'" || ch === '"') return this.parseString()
    if (/[0-9]/.test(ch!) || (ch === '.' && /[0-9]/.test(this.input[this.pos + 1] || ''))) {
      return this.parseNumber()
    }
    if (/[A-Za-z_$#]/.test(ch!)) return this.parsePath()
    throw new Error('无法解析，位置 ' + this.pos + ': ' + this.rest().slice(0, 20))
  }

  parseString(): string {
    const q = this.input[this.pos++]!
    let s = ''
    while (!this.eof()) {
      const ch = this.input[this.pos++]!
      if (ch === '\\' && !this.eof()) {
        const n = this.input[this.pos++]!
        if (n === 'n') s += '\n'
        else if (n === 't') s += '\t'
        else if (n === 'r') s += '\r'
        else s += n
        continue
      }
      if (ch === q) return s
      s += ch
    }
    throw new Error('未闭合的字符串')
  }

  parseNumber(): number {
    const start = this.pos
    while (!this.eof() && /[0-9]/.test(this.peek()!)) this.pos++
    if (!this.eof() && this.peek() === '.') {
      this.pos++
      while (!this.eof() && /[0-9]/.test(this.peek()!)) this.pos++
    }
    if (!this.eof() && /[eE]/.test(this.peek()!)) {
      this.pos++
      if (!this.eof() && /[+-]/.test(this.peek()!)) this.pos++
      while (!this.eof() && /[0-9]/.test(this.peek()!)) this.pos++
    }
    const num = Number(this.input.slice(start, this.pos))
    if (!isFinite(num)) throw new Error('无效数字')
    return num
  }

  parseIdent(): string {
    this.skipWs()
    const start = this.pos
    if (this.eof() || !/[A-Za-z_$#]/.test(this.peek()!)) {
      throw new Error('期望标识符，位置 ' + this.pos)
    }
    this.pos++
    while (!this.eof() && /[A-Za-z0-9_$]/.test(this.peek()!)) this.pos++
    return this.input.slice(start, this.pos)
  }

  parsePath(): unknown {
    const ident = this.parseIdent()
    if (ident === 'true') return true
    if (ident === 'false') return false
    if (ident === 'null' || ident === 'nil') return null
    this.skipWs()
    if (this.peek() === '(') {
      throw new Error('不支持方法调用: ' + ident + '()（浏览器无法实现完整 SpEL）')
    }
    if (ident === 'T' && this.peek() === '(') throw new Error('不支持 T() 类型引用')

    let value: any
    if (ident === '#root' || ident === 'root') value = this.context
    else if (ident.charAt(0) === '#') {
      const key = ident.slice(1)
      if (Object.prototype.hasOwnProperty.call(this.context, key)) value = this.context[key]
      else if (Object.prototype.hasOwnProperty.call(this.context, ident)) value = this.context[ident]
      else value = undefined
    } else if (Object.prototype.hasOwnProperty.call(this.context, ident)) value = this.context[ident]
    else value = this.context[ident]

    for (;;) {
      this.skipWs()
      if (this.match('.')) {
        this.skipWs()
        const prop = this.parseIdent()
        this.skipWs()
        if (this.peek() === '(') throw new Error('不支持方法调用: ' + prop + '()')
        value = value == null ? undefined : value[prop]
        continue
      }
      if (this.input.slice(this.pos, this.pos + 2) === '?.') {
        this.pos += 2
        this.skipWs()
        const prop = this.parseIdent()
        this.skipWs()
        if (this.peek() === '(') throw new Error('不支持方法调用: ' + prop + '()')
        value = value == null ? null : value[prop]
        continue
      }
      if (this.match('[')) {
        this.skipWs()
        let key: any
        if (this.peek() === "'" || this.peek() === '"') key = this.parseString()
        else key = this.parseExpression()
        this.expect(']')
        value = value == null ? undefined : value[key]
        continue
      }
      break
    }
    return value
  }
}

/** 简易 SpEL 子集求值；context 为 JSON 对象 */
export function evalSimpleSpel(expr: string, contextObj?: Record<string, unknown>): unknown {
  if (expr == null || String(expr).trim() === '') throw new Error('表达式不能为空')
  const ctx = contextObj && typeof contextObj === 'object' ? contextObj : {}
  const parser = new SpelSimpleParser(String(expr), ctx)
  const value = parser.parseExpression()
  parser.skipWs()
  if (!parser.eof()) throw new Error('表达式未完全解析，残留: ' + parser.rest())
  return value
}

export function formatSpelEval(expr: string, contextJson: string): string {
  let ctx: Record<string, unknown> = {}
  const raw = String(contextJson || '').trim()
  if (raw) {
    const parsed = JSON.parse(raw)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Context 须为 JSON 对象')
    }
    ctx = parsed as Record<string, unknown>
  }
  const result = evalSimpleSpel(expr, ctx)
  if (result === undefined) return 'undefined'
  if (typeof result === 'string') return JSON.stringify(result)
  return JSON.stringify(result, null, 2)
}
