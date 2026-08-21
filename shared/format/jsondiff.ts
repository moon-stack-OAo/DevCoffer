/** JSON 结构化对比 */

export type DiffItem = {
  path: string
  type: 'added' | 'removed' | 'changed' | 'type_changed'
  left: unknown
  right: unknown
}

export const JSONDIFF_SAMPLE_LEFT = [
  '{',
  '  "id": 1,',
  '  "name": "Alice",',
  '  "role": "admin",',
  '  "tags": ["a", "b"]',
  '}',
].join('\n')

export const JSONDIFF_SAMPLE_RIGHT = [
  '{',
  '  "id": 1,',
  '  "name": "Alice",',
  '  "role": "editor",',
  '  "active": true,',
  '  "tags": ["a", "c"]',
  '}',
].join('\n')

function parse(input: unknown): { ok: boolean; value?: unknown; msg?: string } {
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

function typeOf(v: unknown): string {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

function fmt(v: unknown): string {
  if (v === undefined) return '(无)'
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

function pathKey(path: string, key: string): string {
  if (path === '$' || path === '') return '$.' + key
  return path + '.' + key
}

function pathIndex(path: string, i: number): string {
  const base = path === '' ? '$' : path
  return base + '[' + i + ']'
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return a === b
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return a === b
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false
    return true
  }
  const ao = a as Record<string, unknown>
  const bo = b as Record<string, unknown>
  const ak = Object.keys(ao)
  const bk = Object.keys(bo)
  if (ak.length !== bk.length) return false
  for (const k of ak) {
    if (!Object.prototype.hasOwnProperty.call(bo, k)) return false
    if (!deepEqual(ao[k], bo[k])) return false
  }
  return true
}

function walk(
  left: unknown,
  right: unknown,
  path: string,
  diffs: DiffItem[],
  options: { ignoreArrayOrder?: boolean },
) {
  const lt = typeOf(left)
  const rt = typeOf(right)
  if (lt !== rt) {
    diffs.push({ path: path || '$', type: 'type_changed', left, right })
    return
  }
  if (lt !== 'object' && lt !== 'array') {
    if (left !== right) diffs.push({ path: path || '$', type: 'changed', left, right })
    return
  }
  if (lt === 'array') {
    const la = left as unknown[]
    const ra = right as unknown[]
    if (options.ignoreArrayOrder) {
      const used = ra.map(() => false)
      for (let i = 0; i < la.length; i++) {
        let found = -1
        for (let j = 0; j < ra.length; j++) {
          if (used[j]) continue
          if (deepEqual(la[i], ra[j])) {
            found = j
            break
          }
        }
        if (found >= 0) used[found] = true
        else diffs.push({ path: pathIndex(path || '$', i), type: 'removed', left: la[i], right: undefined })
      }
      for (let j = 0; j < ra.length; j++) {
        if (!used[j])
          diffs.push({ path: pathIndex(path || '$', j), type: 'added', left: undefined, right: ra[j] })
      }
    } else {
      const max = Math.max(la.length, ra.length)
      for (let i = 0; i < max; i++) {
        const p = pathIndex(path || '$', i)
        if (i >= la.length) diffs.push({ path: p, type: 'added', left: undefined, right: ra[i] })
        else if (i >= ra.length) diffs.push({ path: p, type: 'removed', left: la[i], right: undefined })
        else walk(la[i], ra[i], p, diffs, options)
      }
    }
    return
  }
  const lo = left as Record<string, unknown>
  const ro = right as Record<string, unknown>
  const lKeys = Object.keys(lo)
  const rKeys = Object.keys(ro)
  const seen: Record<string, boolean> = Object.create(null)
  for (const k of lKeys) {
    seen[k] = true
    const p = pathKey(path || '$', k)
    if (!Object.prototype.hasOwnProperty.call(ro, k)) {
      diffs.push({ path: p, type: 'removed', left: lo[k], right: undefined })
    } else {
      walk(lo[k], ro[k], p, diffs, options)
    }
  }
  for (const k of rKeys) {
    if (seen[k]) continue
    diffs.push({ path: pathKey(path || '$', k), type: 'added', left: undefined, right: ro[k] })
  }
}

function buildText(diffs: DiffItem[]): string {
  if (!diffs.length) return '两侧 JSON 完全一致，无差异。'
  const typeMeta: Record<string, { mark: string; label: string }> = {
    added: { mark: '+', label: '新增' },
    removed: { mark: '-', label: '删除' },
    changed: { mark: '~', label: '修改' },
    type_changed: { mark: '!', label: '类型变化' },
  }
  const lines: string[] = ['共发现 ' + diffs.length + ' 处差异：', '']
  diffs.forEach((d, i) => {
    const meta = typeMeta[d.type] || { mark: '?', label: d.type }
    lines.push(i + 1 + '. ' + meta.mark + ' [' + meta.label + '] ' + d.path)
    if (d.type === 'added') lines.push('   右侧: ' + fmt(d.right))
    else if (d.type === 'removed') lines.push('   左侧: ' + fmt(d.left))
    else if (d.type === 'type_changed') {
      lines.push('   左侧(' + typeOf(d.left) + '): ' + fmt(d.left))
      lines.push('   右侧(' + typeOf(d.right) + '): ' + fmt(d.right))
    } else {
      lines.push('   左侧: ' + fmt(d.left))
      lines.push('   右侧: ' + fmt(d.right))
    }
    lines.push('')
  })
  return lines.join('\n').replace(/\n$/, '')
}

export function jsonDiff(
  leftInput: unknown,
  rightInput: unknown,
  options: { ignoreArrayOrder?: boolean } = {},
): { ok: boolean; text: string; diffs: DiffItem[]; error?: string } {
  const L = parse(leftInput)
  if (!L.ok) return { ok: false, text: '', diffs: [], error: '左侧: ' + L.msg }
  const R = parse(rightInput)
  if (!R.ok) return { ok: false, text: '', diffs: [], error: '右侧: ' + R.msg }
  const diffs: DiffItem[] = []
  walk(L.value, R.value, '$', diffs, options)
  return { ok: true, text: buildText(diffs), diffs }
}
