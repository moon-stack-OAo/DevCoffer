/** CSS 选择器说明 + 对样例 HTML 做 querySelectorAll（浏览器环境） */

export interface CssSelectorNote {
  sel: string
  desc: string
}

export interface CssExplainResult {
  selector: string
  tips: string[]
  notes: CssSelectorNote[]
  text: string
}

export interface CssQueryResult {
  ok: boolean
  count: number
  matches: string[]
  truncated: boolean
  msg?: string
  text?: string
}

export const CSS_SELECTOR_NOTE_ITEMS: CssSelectorNote[] = [
  { sel: '*', desc: '通用选择器' },
  { sel: 'E', desc: '类型选择器' },
  { sel: '#id', desc: 'ID' },
  { sel: '.class', desc: 'class' },
  { sel: '[attr]', desc: '属性存在' },
  { sel: '[attr=val]', desc: '属性等于' },
  { sel: '[attr^=val]', desc: '属性前缀' },
  { sel: '[attr$=val]', desc: '属性后缀' },
  { sel: '[attr*=val]', desc: '属性包含' },
  { sel: 'E F', desc: '后代' },
  { sel: 'E > F', desc: '子代' },
  { sel: 'E + F', desc: '相邻兄弟' },
  { sel: 'E ~ F', desc: '随后兄弟' },
  { sel: ':hover / :focus / :nth-child()', desc: '伪类' },
  { sel: '::before / ::after', desc: '伪元素' },
  { sel: ':is() / :where() / :has()', desc: '现代伪类' },
]

export const CSS_SELECTOR_NOTES = CSS_SELECTOR_NOTE_ITEMS.map(
  (x) => `${x.sel.padEnd(28)} ${x.desc}`,
).join('\n')

export const CSSELECTOR_SAMPLES = {
  basic: {
    html: '<div class="card"><h1 class="title">Hello</h1><p id="p1">x</p></div>',
    selector: 'div.card > .title',
  },
  list: {
    html: `<ul class="menu">
  <li class="item active">Home</li>
  <li class="item">About</li>
  <li class="item"><a href="#docs">Docs</a></li>
</ul>`,
    selector: 'ul.menu > li.item',
  },
  form: {
    html: `<form id="login">
  <input type="text" name="user" placeholder="用户名" />
  <input type="password" name="pass" />
  <button type="submit" class="btn primary">登录</button>
</form>`,
    selector: 'form#login input[type="text"]',
  },
}

export function collectCssTips(selector: string): string[] {
  const s = String(selector || '').trim()
  if (!s) return []
  const tips: string[] = []
  if (s.includes('>>>') || s.includes('/deep/') || s.includes('::v-deep')) {
    tips.push('含深度选择器（Vue/Angular 历史写法），现代推荐 :deep()')
  }
  if (/:has\(/.test(s)) tips.push('含 :has()，需较新浏览器')
  if (/^[.#]?[\w-]+$/.test(s)) tips.push('简单选择器，性能通常较好')
  if (s.split(/\s+/).length > 4) tips.push('选择器偏长，注意可读性与性能')
  return tips
}

export function explainCssSelectorResult(selector: string): CssExplainResult {
  const s = String(selector || '').trim()
  const tips = collectCssTips(s)
  const text = explainCssSelector(s)
  return { selector: s, tips, notes: CSS_SELECTOR_NOTE_ITEMS, text }
}

export function explainCssSelector(selector: string): string {
  const s = String(selector || '').trim()
  if (!s) {
    return '=== CSS 选择器速查 ===\n' + CSS_SELECTOR_NOTES
  }
  const tips = collectCssTips(s)
  return [
    `选择器: ${s}`,
    tips.length ? `提示:\n- ${tips.join('\n- ')}` : '提示: (无特殊标记)',
    '',
    '=== 速查 ===',
    CSS_SELECTOR_NOTES,
  ].join('\n')
}

/** 预览用：去掉 script，降低 v-html 风险 */
export function sanitizePreviewHtml(html: string): string {
  const raw = html == null ? '' : String(html)
  if (!raw) return ''
  if (typeof DOMParser === 'undefined') {
    return raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  }
  try {
    const parser = new DOMParser()
    const parsed = parser.parseFromString(
      '<!DOCTYPE html><html><body>' + raw + '</body></html>',
      'text/html',
    )
    const root = (parsed.body || parsed.documentElement) as Element
    root.querySelectorAll('script').forEach((n) => n.remove())
    return root.innerHTML
  } catch {
    return raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  }
}

export function queryCssSelector(html: string, selector: string): CssQueryResult {
  const sel = selector == null ? '' : String(selector).trim()
  if (!sel) return { ok: false, count: 0, matches: [], truncated: false, msg: '请输入选择器' }

  if (typeof DOMParser === 'undefined') {
    return {
      ok: false,
      count: 0,
      matches: [],
      truncated: false,
      msg: '当前环境不支持 DOM（请在浏览器中使用查询）',
      text: explainCssSelector(sel),
    }
  }

  const htmlStr = html == null ? '' : String(html)
  let root: Element
  try {
    const parser = new DOMParser()
    const parsed = parser.parseFromString(
      '<!DOCTYPE html><html><body>' + htmlStr + '</body></html>',
      'text/html',
    )
    root = (parsed.body || parsed.documentElement) as Element
  } catch (e) {
    return {
      ok: false,
      count: 0,
      matches: [],
      truncated: false,
      msg: 'HTML 解析失败：' + (e instanceof Error ? e.message : String(e)),
    }
  }

  try {
    const scripts = root.querySelectorAll('script')
    for (let si = scripts.length - 1; si >= 0; si--) scripts[si]!.remove()
  } catch {
    /* ignore */
  }

  let nodes: NodeListOf<Element>
  try {
    nodes = root.querySelectorAll(sel)
  } catch (e) {
    return {
      ok: false,
      count: 0,
      matches: [],
      truncated: false,
      msg: '无效的选择器：' + (e instanceof Error ? e.message : String(e)),
    }
  }

  const matches: string[] = []
  const limit = 50
  for (let i = 0; i < Math.min(nodes.length, limit); i++) {
    const node = nodes[i]!
    matches.push(typeof node.outerHTML === 'string' ? node.outerHTML : String(node))
  }
  const truncated = nodes.length > limit
  const text = [
    `选择器: ${sel}`,
    `匹配数: ${nodes.length}${truncated ? `（仅展示前 ${limit}）` : ''}`,
    '',
    ...(matches.length ? matches.map((m, i) => `--- #${i + 1} ---\n${m}`) : ['(无匹配)']),
  ].join('\n')
  return { ok: true, count: nodes.length, matches, truncated, text }
}
