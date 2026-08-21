/** XPath 查询（浏览器 DOMParser + document.evaluate） */

export const XPATH_SAMPLE_XML = '<root><item id="1">a</item><item id="2">b</item></root>'
export const XPATH_SAMPLE_EXPR = '//item/@id'

/** 将 DOM / XPath 原生英文异常转为中文友好文案 */
export function toFriendlyXPathError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e || '')
  const lower = msg.toLowerCase()

  if (/parsererror|xml\s*parse|not well-formed|invalid xml/i.test(msg)) {
    return 'XML 解析失败，请检查标签是否闭合、是否为合法 XML'
  }
  if (/namespace/i.test(msg)) {
    return 'XPath 命名空间错误：当前未配置 namespace resolver'
  }
  if (/invalid expression|syntax error|xpath/i.test(lower) || /NS_ERROR|DOMException/i.test(msg)) {
    return 'XPath 表达式无效：' + (msg || '请检查语法')
  }
  if (/not implemented|unsupported/i.test(lower)) {
    return '当前环境不支持该 XPath 特性'
  }
  if (!msg || msg === '[object DOMException]') {
    return 'XPath 执行失败，请检查表达式与 XML'
  }
  // 已是中文则原样返回
  if (/[\u4e00-\u9fff]/.test(msg)) return msg
  return 'XPath 执行失败：' + msg
}

export type XPathRunResult = {
  lines: string[]
  text: string
}

/** 在给定 XML 与表达式上执行查询（需浏览器环境） */
export function runXPath(xmlText: string, expr: string): XPathRunResult {
  const xml = String(xmlText || '').trim()
  const path = String(expr || '').trim()
  if (!xml) throw new Error('请输入 XML')
  if (!path) throw new Error('请输入 XPath 表达式')

  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('XML 解析失败，请检查标签是否闭合、是否为合法 XML')
  }

  let r: XPathResult
  try {
    r = doc.evaluate(path, doc, null, XPathResult.ANY_TYPE, null)
  } catch (e) {
    throw new Error(toFriendlyXPathError(e))
  }

  const lines: string[] = []
  try {
    if (r.resultType === XPathResult.NUMBER_TYPE) lines.push(String(r.numberValue))
    else if (r.resultType === XPathResult.STRING_TYPE) lines.push(r.stringValue)
    else if (r.resultType === XPathResult.BOOLEAN_TYPE) lines.push(String(r.booleanValue))
    else {
      let n = r.iterateNext()
      while (n) {
        lines.push(n.nodeType === 2 ? (n as Attr).value : n.textContent || n.nodeName)
        n = r.iterateNext()
      }
    }
  } catch (e) {
    throw new Error(toFriendlyXPathError(e))
  }

  return {
    lines,
    text: lines.join('\n') || '(无结果)',
  }
}
