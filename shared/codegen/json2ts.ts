/** JSON 样例 → TypeScript interface（简化） */

function toPascal(name: string): string {
  return String(name || 'Root')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') || 'Root'
}

function inferTs(val: unknown, name: string, interfaces: Map<string, string>): string {
  if (val === null) return 'null'
  if (typeof val === 'string') return 'string'
  if (typeof val === 'number') return 'number'
  if (typeof val === 'boolean') return 'boolean'
  if (Array.isArray(val)) {
    if (!val.length) return 'unknown[]'
    return inferTs(val[0], name + 'Item', interfaces) + '[]'
  }
  if (typeof val === 'object') {
    const iface = toPascal(name)
    if (!interfaces.has(iface)) {
      const fields: string[] = []
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        fields.push(`  ${k}: ${inferTs(v, k, interfaces)};`)
      }
      interfaces.set(iface, `export interface ${iface} {\n${fields.join('\n')}\n}`)
    }
    return iface
  }
  return 'unknown'
}

export function jsonToTs(
  jsonText: string,
  rootName = 'Root',
  style: 'interface' | 'type' = 'interface',
): string {
  if (!jsonText.trim()) throw new Error('请输入 JSON')
  const obj = JSON.parse(jsonText)
  const interfaces = new Map<string, string>()
  const root = toPascal(rootName || 'Root')
  const t = inferTs(obj, root, interfaces)
  if (typeof obj !== 'object' || obj === null) {
    return style === 'type' ? `export type ${root} = ${t};\n` : `export type ${root} = ${t};\n`
  }
  // ensure root interface exists with root name
  if (!interfaces.has(root) && typeof obj === 'object' && !Array.isArray(obj)) {
    // already created under root
  }
  if (Array.isArray(obj)) {
    const item = inferTs(obj[0] ?? null, root + 'Item', interfaces)
    const alias = style === 'type' ? `export type ${root} = ${item}[];\n` : `export type ${root} = ${item}[];\n`
    return [...interfaces.values()].join('\n\n') + (interfaces.size ? '\n\n' : '') + alias
  }
  // rename first interface if needed
  const parts = [...interfaces.values()]
  if (style === 'type') {
    return parts
      .map((p) => p.replace(/^export interface (\w+)/, 'export type $1 =').replace(/{\n/, '{\n').replace(/\n}$/, '\n};'))
      .join('\n\n')
  }
  return parts.join('\n\n') + '\n'
}
