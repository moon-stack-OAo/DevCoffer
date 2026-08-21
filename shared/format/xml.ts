/** XML 基础缩进美化 / 压缩 / 校验 */

export type XmlValidateResult = {
  ok: boolean
  message: string
}

/** 轻量栈校验（SSR 可用；不替代完整 XML 规范） */
function validateXmlStructural(xml: string): XmlValidateResult {
  const s = String(xml || '')
  const tagRe = /<\/?([A-Za-z_:][\w.\-:]*)(?:\s[^<>]*?)?\s*\/?>|<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[\s\S]*?>/gi
  const stack: string[] = []
  let m: RegExpExecArray | null
  let matched = false

  while ((m = tagRe.exec(s)) !== null) {
    matched = true
    const full = m[0]!
    if (
      full.startsWith('<?') ||
      full.startsWith('<!--') ||
      full.startsWith('<![CDATA[') ||
      /^<!DOCTYPE/i.test(full)
    ) {
      continue
    }
    if (full.endsWith('/>')) continue
    const name = m[1]
    if (!name) continue
    if (full.startsWith('</')) {
      if (!stack.length) {
        return { ok: false, message: `多余的结束标签 </${name}>` }
      }
      const open = stack.pop()!
      if (open !== name) {
        return { ok: false, message: `标签不匹配：期望 </${open}>，实际 </${name}>` }
      }
    } else {
      stack.push(name)
    }
  }

  if (!matched && s.trim()) {
    return { ok: false, message: '未找到有效 XML 标签' }
  }
  if (stack.length) {
    return { ok: false, message: `缺少结束标签：</${stack[stack.length - 1]}>` }
  }
  return { ok: true, message: 'XML 有效' }
}

function validateXmlDom(xml: string): XmlValidateResult {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'application/xml')
    const err = doc.querySelector('parsererror')
    if (err) {
      const detail = (err.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200)
      return {
        ok: false,
        message: detail ? `XML 解析失败：${detail}` : 'XML 解析失败：文档格式无效',
      }
    }
    return { ok: true, message: 'XML 有效' }
  } catch (e) {
    return {
      ok: false,
      message: 'XML 解析失败：' + (e instanceof Error ? e.message : String(e)),
    }
  }
}

/** 校验 XML；浏览器优先 DOMParser，否则走栈校验 */
export function validateXml(raw: string): XmlValidateResult {
  const s = String(raw || '').trim()
  if (!s) return { ok: false, message: '请输入 XML' }
  if (typeof DOMParser !== 'undefined') {
    return validateXmlDom(s)
  }
  return validateXmlStructural(s)
}

function assertValidXml(raw: string): string {
  const s = String(raw || '').trim()
  if (!s) throw new Error('请输入 XML')
  const r = validateXml(s)
  if (!r.ok) throw new Error(r.message)
  return s
}

export function formatXmlStr(xml: string, indentSize = 2): string {
  const size = indentSize < 0 ? 2 : indentSize
  const padUnit = ' '.repeat(size)
  const normalized = String(xml)
    .replace(/\r\n|\r/g, '\n')
    .replace(/>\s*</g, '>\n<')
    .trim()
  if (!normalized) return ''

  const lines = normalized.split('\n')
  let depth = 0
  const out: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim()
    if (!line) continue

    const isClosing = /^<\//.test(line)
    const isDeclOrSpecial =
      /^<\?/.test(line) || /^<!DOCTYPE/i.test(line) || /^<!--/.test(line) || /^<!\[CDATA\[/i.test(line)
    const isSelfClosing = /\/>\s*$/.test(line)
    const isOpenAndClose = /^<[^!?/][^>]*>[\s\S]*<\/[^>]+>\s*$/.test(line) && !isSelfClosing

    if (isClosing) depth = Math.max(0, depth - 1)
    out.push(padUnit.repeat(depth) + line)

    if (!isClosing && !isSelfClosing && !isDeclOrSpecial && !isOpenAndClose && /^</.test(line)) {
      depth++
    }
  }
  return out.join('\n')
}

export function compressXmlStr(xml: string): string {
  return String(xml)
    .replace(/\r\n|\r/g, '\n')
    .replace(/>\s+</g, '><')
    .replace(/\n\s*/g, '')
    .trim()
}

export function formatXml(raw: string, indentSize = 2): string {
  const s = assertValidXml(raw)
  return formatXmlStr(s, indentSize)
}

export function compressXml(raw: string): string {
  const s = assertValidXml(raw)
  return compressXmlStr(s)
}

export const XML_SAMPLE =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<catalog>\n' +
  '  <book id="1">\n' +
  '    <title>示例</title>\n' +
  '    <author>DevCoffer</author>\n' +
  '  </book>\n' +
  '</catalog>\n'
