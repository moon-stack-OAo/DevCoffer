/** CSS 选择器优先级（简化：a,b,c → 内联不计） */

export interface SpecificityResult {
  selector: string
  a: number
  b: number
  c: number
  score: number
  text: string
}

export const SPECIFICITY_PRESETS = [
  { label: '#id', value: '#app' },
  { label: '.class', value: '.nav' },
  { label: 'type', value: 'a' },
  { label: '复合', value: '#app .nav a.active' },
  { label: '属性', value: 'input[type="text"]' },
  { label: '伪类', value: 'a:hover' },
  { label: '伪元素', value: 'p::before' },
]

export function calcSpecificityParts(selector: string): Omit<SpecificityResult, 'text'> {
  const sel = String(selector || '').trim()
  if (!sel) throw new Error('请输入 CSS 选择器')

  let s = sel.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/:[a-z-]+\(/gi, ':pseudo(')
  let a = 0
  let b = 0
  let c = 0

  const ids = s.match(/#[a-zA-Z_][\w-]*/g)
  if (ids) a += ids.length

  const classes = s.match(/\.[a-zA-Z_][\w-]*/g)
  if (classes) b += classes.length

  const attrs = s.match(/\[[^\]]+]/g)
  if (attrs) b += attrs.length

  const pseudoClass = s.match(/:(?!pseudo|:root)[a-zA-Z-]+/g)
  if (pseudoClass) {
    for (const p of pseudoClass) {
      if (/^::/.test(p)) continue
      if (p === ':not' || p.startsWith(':pseudo')) continue
      b += 1
    }
  }

  const pseudoEl = s.match(/::[a-zA-Z-]+/g)
  if (pseudoEl) c += pseudoEl.length

  let t = s
    .replace(/#[a-zA-Z_][\w-]*/g, ' ')
    .replace(/\.[a-zA-Z_][\w-]*/g, ' ')
    .replace(/\[[^\]]*]/g, ' ')
    .replace(/::[a-zA-Z-]+/g, ' ')
    .replace(/:[a-zA-Z-]+(\([^)]*\))?/g, ' ')
    .replace(/[>+~*,]/g, ' ')
  const types = t.match(/[a-zA-Z_][\w-]*/g)
  if (types) {
    for (const x of types) {
      if (x.toLowerCase() === 'not') continue
      c += 1
    }
  }

  const score = a * 100 + b * 10 + c
  return { selector: sel, a, b, c, score }
}

export function calcSpecificity(selector: string): string {
  const r = calcSpecificityParts(selector)
  return formatSpecificityText(r)
}

export function formatSpecificityText(r: Omit<SpecificityResult, 'text'>): string {
  return [
    `选择器: ${r.selector}`,
    `优先级: (${r.a}, ${r.b}, ${r.c})`,
    `权重分: ${r.score}  （a×100 + b×10 + c）`,
    '',
    '说明: a=ID 数, b=class/属性/伪类, c=类型/伪元素；!important 与内联样式未计入。',
  ].join('\n')
}

export function calcSpecificityResult(selector: string): SpecificityResult {
  const parts = calcSpecificityParts(selector)
  return { ...parts, text: formatSpecificityText(parts) }
}

export function specificityBarPct(value: number, max = 5): number {
  if (value <= 0) return 0
  return Math.min(100, Math.round((value / Math.max(max, 1)) * 100))
}
