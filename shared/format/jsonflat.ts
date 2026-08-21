/** JSON 扁平化 / 反扁平化 */

export type JsonFlatResult = { ok: boolean; result: string | null; msg: string }

export const JSONFLAT_SAMPLE = [
  '{',
  '  "user": {',
  '    "name": "Alice",',
  '    "profile": { "age": 30, "city": "Shanghai" }',
  '  },',
  '  "tags": ["dev", "nuxt"]',
  '}',
].join('\n')

/** 扁平叶子：原始值，或空数组/空对象（flatten 对空容器的占位） */
function isFlatLeaf(v: unknown): boolean {
  if (v === null || typeof v !== 'object') return true
  if (Array.isArray(v)) return v.length === 0
  return Object.keys(v as object).length === 0
}

function parseInput(input: unknown): { ok: boolean; value?: unknown; msg?: string } {
  if (input === undefined || input === null) return { ok: false, msg: '输入不能为空' }
  if (typeof input === 'string') {
    const s = input.trim()
    if (!s) return { ok: false, msg: '输入不能为空' }
    try {
      return { ok: true, value: JSON.parse(s) }
    } catch (e) {
      return { ok: false, msg: 'JSON 解析失败: ' + (e instanceof Error ? e.message : String(e)) }
    }
  }
  return { ok: true, value: input }
}

function walkFlatten(
  value: unknown,
  path: string,
  flat: Record<string, unknown>,
  sep: string,
  arrayStyle: 'bracket' | 'dot',
) {
  if (value === null || typeof value !== 'object') {
    flat[path === '' ? '' : path] = value
    return
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      flat[path === '' ? '' : path] = []
      return
    }
    for (let i = 0; i < value.length; i++) {
      const next =
        arrayStyle === 'dot'
          ? path === ''
            ? String(i)
            : path + sep + i
          : path === ''
            ? '[' + i + ']'
            : path + '[' + i + ']'
      walkFlatten(value[i], next, flat, sep, arrayStyle)
    }
    return
  }
  const keys = Object.keys(value as object)
  if (keys.length === 0) {
    flat[path === '' ? '' : path] = {}
    return
  }
  for (const key of keys) {
    const next = path === '' ? key : path + sep + key
    walkFlatten((value as Record<string, unknown>)[key], next, flat, sep, arrayStyle)
  }
}

export function jsonFlatten(
  objOrJson: unknown,
  options: { separator?: string; arrayStyle?: 'bracket' | 'dot' } = {},
): JsonFlatResult {
  const sep = options.separator != null && options.separator !== '' ? String(options.separator) : '.'
  const arrayStyle = options.arrayStyle === 'dot' ? 'dot' : 'bracket'
  const parsed = parseInput(objOrJson)
  if (!parsed.ok) return { ok: false, result: null, msg: parsed.msg! }
  try {
    const flat: Record<string, unknown> = Object.create(null)
    const value = parsed.value
    if (value === null || typeof value !== 'object') flat[''] = value
    else walkFlatten(value, '', flat, sep, arrayStyle)
    const out: Record<string, unknown> = {}
    Object.keys(flat).forEach((k) => {
      out[k] = flat[k]
    })
    return { ok: true, result: JSON.stringify(out, null, 2), msg: '扁平化成功' }
  } catch (e) {
    return { ok: false, result: null, msg: '扁平化失败: ' + (e instanceof Error ? e.message : String(e)) }
  }
}

type Token = { type: 'key' | 'index'; value: string | number }

function parsePath(path: string, sep: string, arrayStyle: 'bracket' | 'dot'): Token[] {
  const tokens: Token[] = []
  if (path === '' || path == null) return tokens
  const s = String(path)
  if (arrayStyle === 'dot') {
    if (sep === '') {
      tokens.push({ type: 'key', value: s })
      return tokens
    }
    for (const p of s.split(sep)) {
      if (p === '') continue
      if (/^\d+$/.test(p)) tokens.push({ type: 'index', value: parseInt(p, 10) })
      else tokens.push({ type: 'key', value: p })
    }
    return tokens
  }
  let i = 0
  const n = s.length
  while (i < n) {
    if (s[i] === '[') {
      const close = s.indexOf(']', i)
      if (close < 0) throw new Error('路径括号未闭合: ' + path)
      const idxStr = s.slice(i + 1, close)
      if (!/^\d+$/.test(idxStr)) throw new Error('非法数组下标: ' + idxStr)
      tokens.push({ type: 'index', value: parseInt(idxStr, 10) })
      i = close + 1
      if (i < n && sep && s.startsWith(sep, i)) i += sep.length
      continue
    }
    let end = n
    const bracket = s.indexOf('[', i)
    if (bracket >= 0 && bracket < end) end = bracket
    if (sep) {
      const si = s.indexOf(sep, i)
      if (si >= 0 && si < end) end = si
    }
    const key = s.slice(i, end)
    if (key !== '') tokens.push({ type: 'key', value: key })
    i = end
    if (sep && i < n && s.startsWith(sep, i)) i += sep.length
  }
  return tokens
}

function setByTokens(root: any, tokens: Token[], leaf: unknown): any {
  if (tokens.length === 0) return leaf
  let cur = root
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!
    const last = i === tokens.length - 1
    const key = t.value as any
    if (last) {
      cur[key] = leaf
      break
    }
    const nextTok = tokens[i + 1]!
    let next = cur[key]
    if (next === undefined || next === null || typeof next !== 'object') {
      next = nextTok.type === 'index' ? [] : {}
      cur[key] = next
    }
    cur = next
  }
  return root
}

function maybeToArray(node: any): any {
  if (node === null || typeof node !== 'object') return node
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) node[i] = maybeToArray(node[i])
    return node
  }
  const keys = Object.keys(node)
  for (const k of keys) node[k] = maybeToArray(node[k])
  if (keys.length === 0) return node
  const nums: number[] = []
  for (const k of keys) {
    if (!/^\d+$/.test(k)) return node
    nums.push(parseInt(k, 10))
  }
  nums.sort((a, b) => a - b)
  for (let i = 0; i < nums.length; i++) if (nums[i] !== i) return node
  const arr: any[] = []
  for (let i = 0; i < nums.length; i++) arr[i] = node[String(i)]
  return arr
}

export function jsonUnflatten(
  flatObjOrJson: unknown,
  options: { separator?: string; arrayStyle?: 'bracket' | 'dot' } = {},
): JsonFlatResult {
  const sep = options.separator != null && options.separator !== '' ? String(options.separator) : '.'
  const arrayStyle = options.arrayStyle === 'dot' ? 'dot' : 'bracket'
  const parsed = parseInput(flatObjOrJson)
  if (!parsed.ok) return { ok: false, result: null, msg: parsed.msg! }
  const flat = parsed.value
  if (flat === null || typeof flat !== 'object' || Array.isArray(flat)) {
    return { ok: false, result: null, msg: '扁平化输入须为对象' }
  }
  try {
    let root: any = {}
    const keys = Object.keys(flat as object)
    // 已是嵌套对象时禁止当「美化」用，避免误导
    for (const k of keys) {
      if (!isFlatLeaf((flat as Record<string, unknown>)[k])) {
        return { ok: false, result: null, msg: '请输入扁平路径对象（如 a.b）' }
      }
    }
    if (keys.length === 1 && keys[0] === '') {
      return { ok: true, result: JSON.stringify((flat as any)[''], null, 2), msg: '反扁平成功' }
    }
    for (const path of keys) {
      const tokens = parsePath(path, sep, arrayStyle)
      if (tokens.length === 0) continue
      if (tokens[0]!.type === 'index' && !Array.isArray(root)) root = []
      setByTokens(root, tokens, (flat as any)[path])
    }
    root = maybeToArray(root)
    return { ok: true, result: JSON.stringify(root, null, 2), msg: '反扁平成功' }
  } catch (e) {
    return { ok: false, result: null, msg: '反扁平失败: ' + (e instanceof Error ? e.message : String(e)) }
  }
}
