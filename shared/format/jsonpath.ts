/** 极简 JSONPath 子集：$.a.b / $.arr[0] / $['k'] */

/** 检测当前不支持的语法，返回中文说明；支持则返回 null */
export function detectUnsupportedJsonPath(path: string): string | null {
  const p = String(path || '').trim()
  if (!p) return null

  // 递归下降 $..
  if (/\.\./.test(p)) {
    return '当前不支持递归下降 $..'
  }
  // 过滤器 [?(...)]
  if (/\[\s*\?/.test(p)) {
    return '当前不支持过滤器 [?(...)]'
  }
  // 通配符 *（属性或下标）
  if (/(?:^|[\.\[])\*(?:$|[\.\]])/.test(p) || /\[\s*\*\s*\]/.test(p) || /\.\*/.test(p)) {
    return '当前不支持通配符 *'
  }
  // 切片 [0:2] / [-1:] 等
  if (/\[\s*-?\d*\s*:\s*-?\d*\s*(?::\s*-?\d*\s*)?\]/.test(p)) {
    return '当前不支持数组切片 [:]'
  }
  // 多下标 [0,1]
  if (/\[\s*\d+\s*,/.test(p)) {
    return '当前不支持多下标选择 [0,1]'
  }
  return null
}

export function evalJsonPath(data: unknown, path: string): unknown[] {
  const p = String(path || '').trim()
  if (!p) throw new Error('请输入 JSONPath')

  const unsupported = detectUnsupportedJsonPath(p)
  if (unsupported) throw new Error(unsupported)

  if (p === '$') return [data]

  let expr = p
  if (expr.startsWith('$.')) expr = expr.slice(2)
  else if (expr.startsWith('$[')) expr = expr.slice(1)
  else if (expr.startsWith('$')) expr = expr.slice(1)
  else throw new Error('路径需以 $ 开头（子集）')

  const tokens: Array<string | number> = []
  let i = 0
  while (i < expr.length) {
    if (expr[i] === '.') {
      i++
      continue
    }
    if (expr[i] === '[') {
      i++
      if (expr[i] === "'" || expr[i] === '"') {
        const q = expr[i]!
        i++
        let key = ''
        while (i < expr.length && expr[i] !== q) {
          key += expr[i]
          i++
        }
        i++
        if (expr[i] === ']') i++
        tokens.push(key)
        continue
      }
      let num = ''
      while (i < expr.length && expr[i] !== ']') {
        num += expr[i]
        i++
      }
      if (expr[i] === ']') i++
      if (!/^\d+$/.test(num)) throw new Error('仅支持数字下标: [' + num + ']')
      tokens.push(parseInt(num, 10))
      continue
    }
    let key = ''
    while (i < expr.length && expr[i] !== '.' && expr[i] !== '[') {
      key += expr[i]
      i++
    }
    if (key) tokens.push(key)
  }

  let cur: unknown = data
  for (const t of tokens) {
    if (cur == null) return []
    if (typeof t === 'number') {
      if (!Array.isArray(cur)) return []
      cur = cur[t]
    } else {
      if (typeof cur !== 'object') return []
      cur = (cur as Record<string, unknown>)[t]
    }
  }
  if (cur === undefined) return []
  return [cur]
}

export function runJsonPath(jsonText: string, path: string): string {
  const raw = String(jsonText || '').trim()
  if (!raw) throw new Error('请输入 JSON')
  const p = String(path || '').trim()
  if (!p) throw new Error('请输入 JSONPath')

  const unsupported = detectUnsupportedJsonPath(p)
  if (unsupported) throw new Error(unsupported)

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error('JSON 解析失败，请检查输入')
  }

  const results = evalJsonPath(data, p)
  // 空结果与语法不支持已区分：此处表示路径合法但未命中
  if (!results.length || (results.length === 1 && results[0] === undefined)) {
    return '(无匹配结果)'
  }
  return JSON.stringify(results.length === 1 ? results[0] : results, null, 2)
}

export const JSONPATH_SAMPLE_JSON = [
  '{',
  '  "store": {',
  '    "book": [',
  '      { "title": "A", "price": 8.95 },',
  '      { "title": "B", "price": 12 }',
  '    ],',
  '    "bicycle": { "color": "red" }',
  '  }',
  '}',
].join('\n')

export const JSONPATH_SAMPLE_PATH = '$.store.book[0].title'
