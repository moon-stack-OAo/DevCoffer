/** Bean Validation 注解片段生成 */

export type BvField = { name: string; type: string }

export function parseBvFields(text: string): BvField[] {
  return String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((line) => {
      let m = line.match(/^([A-Za-z_$][\w$.<>\[\],\s?]*)\s+([A-Za-z_$][\w$]*)$/)
      if (m) return { type: m[1]!.trim(), name: m[2]! }
      m = line.match(/^([A-Za-z_$][\w$]*)\s*[:=]\s*([A-Za-z_$][\w$.<>\[\],\s?]*)$/)
      if (m) return { name: m[1]!, type: m[2]!.trim() }
      return { name: line, type: 'String' }
    })
}

function annosFor(type: string, name: string): string[] {
  const n = name.toLowerCase()
  const list: string[] = []
  if (type === 'String') {
    list.push('@NotBlank')
    list.push('@Size(max = 255)')
    if (/(email|mail)/.test(n)) list.push('@Email')
    if (/(phone|mobile|tel)/.test(n)) list.push('@Pattern(regexp = "^1[3-9]\\\\d{9}$")')
  } else if (type === 'Integer' || type === 'int' || type === 'Long' || type === 'long') {
    list.push('@NotNull')
    if (/(age)/.test(n)) {
      list.push('@Min(0)')
      list.push('@Max(150)')
    }
  } else if (type === 'BigDecimal' || type === 'Double' || type === 'double') {
    list.push('@NotNull')
    list.push('@DecimalMin("0.00")')
  } else if (/LocalDate|Date/.test(type)) {
    list.push('@NotNull')
    if (/(birth|birthday)/.test(n)) list.push('@Past')
  } else {
    list.push('@NotNull')
  }
  return list
}

export function generateBeanVal(className: string, fieldsText: string): string {
  const name = (className || 'Request').trim() || 'Request'
  const fields = parseBvFields(fieldsText)
  if (!fields.length) throw new Error('请输入字段列表')

  const imports = new Set<string>([
    'javax.validation.constraints.NotBlank',
    'javax.validation.constraints.NotNull',
    'javax.validation.constraints.Size',
  ])
  const body: string[] = []
  for (const f of fields) {
    const annos = annosFor(f.type, f.name)
    for (const a of annos) {
      if (a.startsWith('@Email')) imports.add('javax.validation.constraints.Email')
      if (a.startsWith('@Pattern')) imports.add('javax.validation.constraints.Pattern')
      if (a.startsWith('@Min')) imports.add('javax.validation.constraints.Min')
      if (a.startsWith('@Max')) imports.add('javax.validation.constraints.Max')
      if (a.startsWith('@DecimalMin')) imports.add('javax.validation.constraints.DecimalMin')
      if (a.startsWith('@Past')) imports.add('javax.validation.constraints.Past')
      body.push('    ' + a)
    }
    body.push(`    private ${f.type} ${f.name};`)
    body.push('')
  }

  return [
    ...[...imports].sort().map((i) => 'import ' + i + ';'),
    '',
    `public class ${name} {`,
    '',
    ...body,
    '}',
  ].join('\n')
}
