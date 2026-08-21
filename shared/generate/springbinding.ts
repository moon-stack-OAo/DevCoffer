/** Spring Boot relaxed binding 键名互转 */

function splitCamel(word: string): string[] {
  if (!word) return []
  return String(word)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.toLowerCase())
}

export function springBindingTokenize(key: string): string[] {
  const s = String(key).trim()
  if (!s) return []
  const norm = s.replace(/[.\-]/g, '_')
  if (/^[A-Z0-9_]+$/.test(norm) && /_/.test(norm)) {
    return norm
      .split('_')
      .filter(Boolean)
      .map((t) => t.toLowerCase())
  }
  const parts: string[] = []
  for (const chunk of norm.split('_').filter(Boolean)) {
    parts.push(...splitCamel(chunk))
  }
  return parts.filter(Boolean)
}

export type SpringBindingForms = {
  canonical: string
  camel: string
  kebab: string
  snake: string
  env: string
  systemProp: string
}

export function springBindingFromTokens(tokens: string[]): SpringBindingForms {
  const t = tokens
    .map((x) => String(x).toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(Boolean)
  if (!t.length) {
    return { canonical: '', camel: '', kebab: '', snake: '', env: '', systemProp: '' }
  }
  const kebab = t.join('-')
  const snake = t.join('_')
  const camel =
    t[0]! +
    t
      .slice(1)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('')
  return {
    canonical: t.join('.'),
    camel,
    kebab,
    snake,
    env: t.join('_').toUpperCase(),
    systemProp: t.join('.'),
  }
}

export function springBindingConvert(key: string): { ok: true; results: SpringBindingForms; tokens: string[] } | { ok: false; msg: string } {
  if (key == null || !String(key).trim()) return { ok: false, msg: '请输入配置键' }
  const tokens = springBindingTokenize(key)
  if (!tokens.length) return { ok: false, msg: '无法识别的键名' }
  return { ok: true, results: springBindingFromTokens(tokens), tokens }
}

export function formatSpringBinding(key: string): string {
  const r = springBindingConvert(key)
  if (!r.ok) throw new Error(r.msg)
  const x = r.results
  return [
    `tokens: ${r.tokens.join(' / ')}`,
    `canonical: ${x.canonical}`,
    `camel:      ${x.camel}`,
    `kebab:      ${x.kebab}`,
    `snake:      ${x.snake}`,
    `env:        ${x.env}`,
    `systemProp: ${x.systemProp}`,
    '',
    `# application.yml`,
    `${x.kebab.replace(/-/g, '.')}:`,
    `# 或`,
    `${x.canonical}: value`,
    '',
    `# ENV`,
    `${x.env}=value`,
  ].join('\n')
}
