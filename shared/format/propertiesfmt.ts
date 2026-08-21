/** Java Properties 简单解析 / 格式化 / 校验 */

function decodeUnicodeEscape(s: string): string {
  return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function encodeUnicodeEscape(s: string): string {
  return s.replace(/[^\x20-\x7E]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
}

export type PropParseIssue = {
  line: number
  message: string
}

export type PropParseResult = {
  map: Map<string, string>
  order: string[]
  duplicates: Array<{ key: string; lines: number[] }>
  /** 解析过程中发现的问题 */
  issues: PropParseIssue[]
}

/** 检查转义序列是否异常（不含合法 \\uXXXX / \\n 等） */
function findBadEscape(s: string): string | null {
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '\\') continue
    if (i + 1 >= s.length) return '行末孤立反斜杠转义'
    const n = s[i + 1]!
    if (n === 'u') {
      const hex = s.slice(i + 2, i + 6)
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) return '非法 Unicode 转义 \\uXXXX'
      i += 5
      continue
    }
    // 常见合法转义
    if ('nrtf\\:=# !'.includes(n)) {
      i++
      continue
    }
    return '异常转义序列 \\' + n
  }
  return null
}

export function parseProperties(text: string): PropParseResult {
  const lines = (text || '').split(/\r?\n/)
  const map = new Map<string, string>()
  const order: string[] = []
  const duplicates: Array<{ key: string; lines: number[] }> = []
  const issues: PropParseIssue[] = []
  const lineOfKey = new Map<string, number>()
  let buffer: string | null = null
  let bufferStartLine = 0
  let lineNo = 0

  function flushBuffer(finalLine: string, finalLineNo: number) {
    if (buffer === null) return
    const line = buffer + (finalLine || '')
    const reportLine = bufferStartLine || finalLineNo
    buffer = null
    bufferStartLine = 0

    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) return

    const badEsc = findBadEscape(line)
    if (badEsc) {
      issues.push({ line: reportLine, message: badEsc })
    }

    // key 与分隔符：= / : / 空白；key 不能为空
    const sepMatch = line.match(/^\s*([^:=\s][^:=]*?)(\s*[:=]\s*|\s+)(.*)$/)
    if (!sepMatch) {
      // 无分隔符的非注释行
      if (/^\s*[:=]/.test(line)) {
        issues.push({ line: reportLine, message: '键名不能为空' })
      } else {
        issues.push({ line: reportLine, message: '非法行：缺少 "=" 或 ":"' })
      }
      return
    }

    let key = sepMatch[1]!.trim()
    let value = (sepMatch[3] || '').replace(/\\([\s\\:=])/g, '$1')
    if (!key) {
      issues.push({ line: reportLine, message: '键名不能为空' })
      return
    }

    try {
      key = decodeUnicodeEscape(key)
      value = decodeUnicodeEscape(value)
    } catch {
      issues.push({ line: reportLine, message: 'Unicode 转义解码失败' })
      return
    }

    if (map.has(key)) {
      const existing = duplicates.find((d) => d.key === key)
      const origLine = lineOfKey.get(key) || 0
      if (existing) existing.lines.push(finalLineNo)
      else duplicates.push({ key, lines: [origLine, finalLineNo] })
      // 重复不写入 issues，由 validate 单独判定；format 保留最后一次赋值
    }
    map.set(key, value)
    lineOfKey.set(key, finalLineNo)
    if (order.indexOf(key) === -1) order.push(key)
  }

  for (const raw of lines) {
    lineNo++
    if (buffer !== null) {
      if (raw.endsWith('\\')) {
        buffer += raw.slice(0, -1)
        continue
      }
      buffer += raw
      flushBuffer('', lineNo)
      continue
    }
    if (raw.endsWith('\\') && !raw.trimStart().startsWith('#') && !raw.trimStart().startsWith('!')) {
      buffer = raw.slice(0, -1)
      bufferStartLine = lineNo
      continue
    }
    buffer = raw
    bufferStartLine = lineNo
    flushBuffer('', lineNo)
  }
  if (buffer !== null) flushBuffer('', lineNo)

  return { map, order, duplicates, issues }
}

export type FormatPropOptions = {
  sort?: boolean
  useUnicode?: boolean
  separator?: string
  /** 为 true 时遇非法行抛错（默认 true） */
  strict?: boolean
}

export function formatProperties(text: string, options: FormatPropOptions = {}): string {
  const strict = options.strict !== false
  const raw = String(text ?? '').trim()
  if (!raw) throw new Error('请输入 Properties')

  const parsed = parseProperties(text)
  if (strict && parsed.issues.length) {
    const detail = parsed.issues
      .slice(0, 8)
      .map((x) => `第 ${x.line} 行：${x.message}`)
      .join('；')
    throw new Error('Properties 格式无效：' + detail)
  }

  let keys = parsed.order.slice()
  if (options.sort) keys = keys.slice().sort()
  const sep = options.separator != null ? options.separator : '='
  return keys
    .map((key) => {
      let value = parsed.map.get(key) ?? ''
      if (options.useUnicode) {
        value = encodeUnicodeEscape(value)
      } else {
        value = value
          .replace(/\\/g, '\\\\')
          .replace(/=/g, '\\=')
          .replace(/#/g, '\\#')
          .replace(/!/g, '\\!')
          .replace(/\n/g, '\\n')
      }
      return key + sep + value
    })
    .join('\n')
}

/** 校验；失败抛错供 UI setError，成功返回「通过」+ 统计 */
export function validateProperties(text: string): string {
  const raw = String(text ?? '').trim()
  if (!raw) throw new Error('请输入 Properties')
  const parsed = parseProperties(raw)
  const errors: string[] = []
  for (const x of parsed.issues) {
    errors.push(`第 ${x.line} 行：${x.message}`)
  }
  for (const d of parsed.duplicates) {
    errors.push(`重复 key: ${d.key}（行 ${d.lines.join(', ')}）`)
  }
  if (errors.length) {
    throw new Error('校验未通过：\n' + errors.slice(0, 12).join('\n'))
  }
  return [
    '校验通过',
    '条目数: ' + parsed.order.length,
    '重复 key: 无',
  ].join('\n')
}

export const PROPERTIES_SAMPLE = [
  '# 应用配置',
  'app.name=Demo',
  'app.port=8080',
  'app.debug=true',
  '你好=世界',
].join('\n')
