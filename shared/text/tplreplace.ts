/** 字符串模板替换 */

export const TPL_PATTERNS: Record<string, { regex: RegExp; label: string }> = {
  js: { regex: /\$\{\s*([a-zA-Z_$][\w$]*)\s*\}/g, label: '${var}' },
  mybatis: { regex: /#\{\s*([a-zA-Z_$][\w$]*)\s*\}/g, label: '#{var}' },
  mustache: { regex: /\{\{\s*([a-zA-Z_$][\w$]*)\s*\}\}/g, label: '{{var}}' },
  spring: { regex: /\$([a-zA-Z_$][\w$]*)\$/g, label: '$var$' },
  ibatis: { regex: /:\s*([a-zA-Z_$][\w$]*)/g, label: ':var' },
}

export type TplResult = {
  text: string
  missing: string[]
  used: string[]
}

/** 解析 key=value 多行变量 */
export function parseVarsText(raw: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of String(raw || '').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    if (!key) continue
    result[key] = trimmed.slice(eq + 1)
  }
  return result
}

export function applyTemplate(
  tpl: string,
  vars: Record<string, string>,
  syntax: string = 'mustache',
): TplResult {
  const pattern = TPL_PATTERNS[syntax]
  if (!pattern) throw new Error('不支持的语法: ' + syntax)
  const used = new Set<string>()
  const missing = new Set<string>()
  const re = new RegExp(pattern.regex.source, pattern.regex.flags)
  const text = tpl.replace(re, (m, key: string) => {
    used.add(key)
    if (Object.prototype.hasOwnProperty.call(vars, key)) return String(vars[key])
    missing.add(key)
    return m
  })
  return { text, missing: [...missing], used: [...used] }
}
