/** Builder 模式代码生成（类名 + 字段列表） */

export type BuilderField = { name: string; type: string }

export function parseFieldsText(text: string): BuilderField[] {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
  const fields: BuilderField[] = []
  for (const line of lines) {
    // type name 或 name:type
    let m = line.match(/^([A-Za-z_$][\w$.<>\[\],\s?]*)\s+([A-Za-z_$][\w$]*)$/)
    if (m) {
      fields.push({ type: m[1]!.trim().replace(/\s+/g, ' '), name: m[2]! })
      continue
    }
    m = line.match(/^([A-Za-z_$][\w$]*)\s*[:=]\s*([A-Za-z_$][\w$.<>\[\],\s?]*)$/)
    if (m) {
      fields.push({ name: m[1]!, type: m[2]!.trim().replace(/\s+/g, ' ') })
      continue
    }
    // 仅 name → String
    if (/^[A-Za-z_$][\w$]*$/.test(line)) fields.push({ name: line, type: 'String' })
  }
  return fields
}

function cap(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export function generateBuilder(className: string, fieldsText: string, lombok = false): string {
  const name = (className || 'Generated').trim() || 'Generated'
  const fields = parseFieldsText(fieldsText)
  if (!fields.length) throw new Error('请输入至少一个字段（如 String name）')

  if (lombok) {
    const lines = [
      'import lombok.Builder;',
      'import lombok.Data;',
      '',
      '@Data',
      '@Builder',
      `public class ${name} {`,
      ...fields.map((f) => `    private ${f.type} ${f.name};`),
      '}',
    ]
    return lines.join('\n')
  }

  const lines: string[] = []
  lines.push(`public class ${name} {`)
  fields.forEach((f) => lines.push(`    private final ${f.type} ${f.name};`))
  lines.push('')
  lines.push(`    private ${name}(Builder b) {`)
  fields.forEach((f) => lines.push(`        this.${f.name} = b.${f.name};`))
  lines.push('    }')
  lines.push('')
  lines.push('    public static Builder builder() { return new Builder(); }')
  lines.push('')
  fields.forEach((f) => {
    const g =
      f.type === 'boolean' || f.type === 'Boolean'
        ? 'is' + cap(f.name)
        : 'get' + cap(f.name)
    lines.push(`    public ${f.type} ${g}() { return ${f.name}; }`)
  })
  lines.push('')
  lines.push('    public static final class Builder {')
  fields.forEach((f) => lines.push(`        private ${f.type} ${f.name};`))
  lines.push('')
  fields.forEach((f) => {
    lines.push(`        public Builder ${f.name}(${f.type} ${f.name}) {`)
    lines.push(`            this.${f.name} = ${f.name};`)
    lines.push('            return this;')
    lines.push('        }')
  })
  lines.push('')
  lines.push(`        public ${name} build() { return new ${name}(this); }`)
  lines.push('    }')
  lines.push('}')
  return lines.join('\n')
}
