/** 参考速查：过滤与文本化（无 DOM） */

export type RefItem = {
  name?: string
  cmd?: string
  title?: string
  pattern?: string
  codeLabel?: string
  ann?: string
  method?: string
  key?: string
  arg?: string
  type?: string
  default?: string
  complexity?: string
  outputs?: string[]
  desc?: string
  code?: string
  syntax?: string
  examples?: string[]
  returns?: string
  scenario?: string
  example?: string
  dir?: string
  port?: string
  proto?: string
  service?: string
  cat?: string
  [key: string]: unknown
}

export type RefGroup = { cat: string; items: RefItem[] }

export function itemTitle(item: RefItem): string {
  if (!item) return ''
  return String(
    item.name ||
      item.cmd ||
      item.title ||
      item.pattern ||
      item.ann ||
      item.method ||
      item.key ||
      item.arg ||
      item.codeLabel ||
      item.service ||
      item.port ||
      '',
  )
}

/** 复制优先：代码/命令类字段优先于标题主键 */
export function itemCopyText(item: RefItem): string {
  if (!item) return ''
  return String(
    item.code ||
      item.cmd ||
      item.syntax ||
      item.example ||
      item.pattern ||
      item.ann ||
      item.method ||
      item.key ||
      item.arg ||
      item.codeLabel ||
      itemTitle(item) ||
      '',
  )
}

function itemHaystack(item: RefItem): string {
  const parts = [
    itemTitle(item),
    item.ann,
    item.method,
    item.key,
    item.arg,
    item.type,
    item.default,
    item.complexity,
    item.desc,
    item.code,
    item.syntax,
    item.returns,
    item.scenario,
    item.example,
    item.dir,
    item.proto,
    item.service,
    item.port,
    item.cat,
    item.pattern,
    item.codeLabel,
    ...(item.examples || []),
    ...(item.outputs || []),
  ]
  return parts.filter(Boolean).join('\n').toLowerCase()
}

export function filterGroups(data: RefGroup[], keyword: string): RefGroup[] {
  const list = Array.isArray(data) ? data : []
  const kw = String(keyword || '').trim().toLowerCase()
  if (!kw) {
    return list.map((g) => ({ cat: g.cat, items: (g.items || []).slice() }))
  }
  const result: RefGroup[] = []
  for (const group of list) {
    const matched = (group.items || []).filter((i) => itemHaystack(i).includes(kw))
    if (matched.length) result.push({ cat: group.cat, items: matched })
  }
  return result
}

export function filterFlat(items: RefItem[], keyword: string): RefItem[] {
  const list = Array.isArray(items) ? items : []
  const kw = String(keyword || '').trim().toLowerCase()
  if (!kw) return list.slice()
  return list.filter((i) => itemHaystack(i).includes(kw))
}

/** 将任意条目格式化为可读文本块 */
export function formatItem(item: RefItem): string {
  const title = itemTitle(item)
  const lines: string[] = []
  if (title) lines.push(title)
  if (item.type) lines.push(`类型: ${item.type}`)
  if (item.complexity) lines.push(`复杂度: ${item.complexity}`)
  if (item.default != null && item.default !== '') lines.push(`默认: ${item.default}`)
  if (item.dir) lines.push(`方向: ${item.dir}`)
  if (item.port) lines.push(`端口: ${item.port}${item.proto ? ' / ' + item.proto : ''}`)
  if (item.service && item.service !== title) lines.push(`服务: ${item.service}`)
  if (item.cat && !item.port) lines.push(`分类: ${item.cat}`)
  if (item.desc) lines.push(item.desc)
  if (item.scenario) lines.push(`场景: ${item.scenario}`)
  if (item.syntax) lines.push(`语法: ${item.syntax}`)
  if (item.ann && item.ann !== title) lines.push(`注解: ${item.ann}`)
  if (item.method && item.method !== title) lines.push(`方法: ${item.method}`)
  if (item.key && item.key !== title) lines.push(`键: ${item.key}`)
  if (item.arg && item.arg !== title) lines.push(`参数: ${item.arg}`)
  if (item.example) lines.push(`示例: ${item.example}`)
  if (item.examples?.length) {
    lines.push('示例:')
    for (const ex of item.examples) lines.push(`  - ${ex}`)
  }
  if (item.outputs?.length) {
    lines.push('输出:')
    for (const out of item.outputs) lines.push(`  - ${out}`)
  }
  if (item.returns) lines.push(`返回: ${item.returns}`)
  if (item.code) lines.push('```\n' + item.code + '\n```')
  // 布尔/其它短字段
  if (item.isDefault === true) lines.push('(默认)')
  return lines.join('\n')
}

export function formatGroups(groups: RefGroup[]): string {
  if (!groups.length) return '无匹配结果'
  const parts: string[] = []
  for (const g of groups) {
    parts.push(`=== ${g.cat} ===`)
    for (const item of g.items || []) {
      parts.push(formatItem(item), '')
    }
  }
  return parts.join('\n').trimEnd()
}

export function formatFlat(items: RefItem[], title = '结果'): string {
  if (!items.length) return '无匹配结果'
  const parts = [`=== ${title} (${items.length}) ===`]
  for (const item of items) {
    parts.push(formatItem(item), '')
  }
  return parts.join('\n').trimEnd()
}

/** 将 flat 列表按 dir/cat 字段分组 */
export function groupByField(items: RefItem[], field: 'dir' | 'cat' = 'cat'): RefGroup[] {
  const map = new Map<string, RefItem[]>()
  for (const item of items) {
    const key = String(item[field] || '其它')
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return [...map.entries()].map(([cat, list]) => ({ cat, items: list }))
}

/** 规范化 payload → 可搜索分组 */
export function normalizePayload(payload: {
  kind: string
  data: unknown
}): RefGroup[] {
  const { kind, data } = payload
  if (kind === 'groups') return data as RefGroup[]
  if (kind === 'flat') {
    const items = data as RefItem[]
    if (items[0] && (items[0].dir || items[0].port)) {
      return groupByField(items, items[0].dir ? 'dir' : 'cat')
    }
    return [{ cat: '全部', items }]
  }
  if (kind === 'multi') {
    const obj = data as Record<string, unknown>
    const groups: RefGroup[] = []
    for (const [k, v] of Object.entries(obj)) {
      if (Array.isArray(v) && v[0]?.items) {
        groups.push(...(v as RefGroup[]))
      } else if (Array.isArray(v)) {
        groups.push({ cat: k, items: v as RefItem[] })
      }
    }
    return groups
  }
  if (kind === 'mq') {
    const obj = data as Record<string, RefGroup[]>
    const groups: RefGroup[] = []
    for (const [tab, list] of Object.entries(obj)) {
      for (const g of list || []) {
        groups.push({ cat: `[${tab}] ${g.cat}`, items: g.items })
      }
    }
    return groups
  }
  return []
}

export function searchRefPayload(
  payload: { kind: string; data: unknown },
  keyword: string,
): string {
  const groups = filterGroups(normalizePayload(payload), keyword)
  return formatGroups(groups)
}

/** 结构化查询：供左右分栏面板使用 */
export function queryRefPayload(
  payload: { kind: string; data: unknown },
  keyword: string,
): RefGroup[] {
  return filterGroups(normalizePayload(payload), keyword)
}

export function countItems(groups: RefGroup[]): number {
  return groups.reduce((n, g) => n + (g.items?.length || 0), 0)
}
