/** JSON 结构转换：键排序 / 数组包装 / ↔ YAML（js-yaml） */
import { dump as yamlDump, load as yamlLoad } from 'js-yaml'

function sortKeysDeep(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeysDeep)
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    const out: Record<string, unknown> = {}
    Object.keys(o)
      .sort()
      .forEach((k) => {
        out[k] = sortKeysDeep(o[k])
      })
    return out
  }
  return v
}

export function jsonSortKeys(text: string, pretty = true): string {
  const obj = JSON.parse(text)
  const sorted = sortKeysDeep(obj)
  return pretty ? JSON.stringify(sorted, null, 2) : JSON.stringify(sorted)
}

export function jsonWrapArray(text: string): string {
  const obj = JSON.parse(text)
  if (Array.isArray(obj)) return JSON.stringify(obj, null, 2)
  return JSON.stringify([obj], null, 2)
}

export function jsonToYaml(text: string): string {
  const obj = JSON.parse(text)
  return yamlDump(obj, { indent: 2, lineWidth: -1, sortKeys: false })
}

export function yamlToJsonText(text: string, pretty = true): string {
  const obj = yamlLoad(text)
  return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj)
}
