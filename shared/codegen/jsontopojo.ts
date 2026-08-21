/** JSON 样例 → Java POJO（简化） */

function inferType(key: string, val: unknown, imports: Set<string>): string {
  if (val === null) return 'String'
  if (typeof val === 'string') return 'String'
  if (typeof val === 'number') return Number.isInteger(val) ? 'Integer' : 'Double'
  if (typeof val === 'boolean') return 'Boolean'
  if (Array.isArray(val)) {
    imports.add('java.util.List')
    if (val.length > 0) {
      const itemType = inferType(key + 'Item', val[0], imports)
      return 'List<' + itemType + '>'
    }
    return 'List<?>'
  }
  if (typeof val === 'object') {
    imports.add('java.util.Map')
    return 'Map<String, Object>'
  }
  return 'String'
}

export function jsonToPojo(jsonText: string, className = 'GeneratedClass', lombok = true): string {
  if (!jsonText.trim()) throw new Error('请输入 JSON')
  const obj = JSON.parse(jsonText)
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error('请输入 JSON 对象（非数组）')
  }
  const imports = new Set<string>()
  const fields: Array<{ name: string; type: string }> = []
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    fields.push({ name: key, type: inferType(key, val, imports) })
  }
  let code = ''
  if (lombok) code += 'import lombok.Data;\n'
  ;[...imports].sort().forEach((i) => {
    code += 'import ' + i + ';\n'
  })
  if (imports.size || lombok) code += '\n'
  if (lombok) code += '@Data\n'
  code += 'public class ' + (className.trim() || 'GeneratedClass') + ' {\n\n'
  fields.forEach((f) => {
    code += '    private ' + f.type + ' ' + f.name + ';\n'
  })
  code += '\n}'
  return code
}
