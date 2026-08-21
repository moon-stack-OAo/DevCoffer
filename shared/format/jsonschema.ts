/** 极简 JSON Schema 校验：type / required / properties */

export function validateJsonSchema(dataText: string, schemaText: string): string {
  let data: unknown
  let schema: Record<string, unknown>
  try {
    data = JSON.parse(String(dataText || ''))
  } catch {
    throw new Error('数据 JSON 解析失败')
  }
  try {
    schema = JSON.parse(String(schemaText || ''))
  } catch {
    throw new Error('Schema JSON 解析失败')
  }
  const errors: string[] = []
  walk('$', data, schema, errors)
  if (!errors.length) return '✓ 校验通过（基础 type/required/properties）'
  return ['✗ 校验失败:', ...errors.map((e) => '- ' + e)].join('\n')
}

function walk(path: string, data: unknown, schema: Record<string, unknown>, errors: string[]) {
  if (!schema || typeof schema !== 'object') return
  const typ = schema.type
  if (typ) {
    const ok = checkType(data, typ)
    if (!ok) errors.push(`${path}: 期望 type=${JSON.stringify(typ)}，实际=${actualType(data)}`)
  }
  if (schema.enum && Array.isArray(schema.enum)) {
    if (!schema.enum.some((x) => JSON.stringify(x) === JSON.stringify(data))) {
      errors.push(`${path}: 不在 enum 中`)
    }
  }
  if (typ === 'object' || (!typ && data && typeof data === 'object' && !Array.isArray(data))) {
    const obj = (data || {}) as Record<string, unknown>
    const req = schema.required
    if (Array.isArray(req)) {
      for (const k of req) {
        if (obj[k as string] === undefined) errors.push(`${path}: 缺少 required 字段 ${k}`)
      }
    }
    const props = schema.properties as Record<string, Record<string, unknown>> | undefined
    if (props && data && typeof data === 'object' && !Array.isArray(data)) {
      for (const [k, sub] of Object.entries(props)) {
        if (obj[k] !== undefined) walk(`${path}.${k}`, obj[k], sub, errors)
      }
    }
  }
  if ((typ === 'array' || Array.isArray(data)) && schema.items && Array.isArray(data)) {
    const items = schema.items as Record<string, unknown>
    data.forEach((el, i) => walk(`${path}[${i}]`, el, items, errors))
  }
}

function actualType(v: unknown): string {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

function checkType(v: unknown, typ: unknown): boolean {
  const types = Array.isArray(typ) ? typ : [typ]
  return types.some((t) => {
    if (t === 'null') return v === null
    if (t === 'array') return Array.isArray(v)
    if (t === 'object') return v !== null && typeof v === 'object' && !Array.isArray(v)
    if (t === 'integer') return typeof v === 'number' && Number.isInteger(v)
    return typeof v === t
  })
}
