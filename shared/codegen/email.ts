/** 邮件地址校验 / 提取 */

const EMAIL_RE =
  /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/g

export function validateEmail(addr: string): { ok: boolean; msg: string } {
  const s = String(addr || '').trim()
  if (!s) return { ok: false, msg: '请输入邮箱' }
  // 简化 RFC：单地址
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  if (!re.test(s)) return { ok: false, msg: '格式无效' }
  if (s.length > 254) return { ok: false, msg: '过长（>254）' }
  const [local, domain] = s.split('@')
  if (!local || local.length > 64) return { ok: false, msg: '本地部分过长' }
  if (!domain || !domain.includes('.')) return { ok: false, msg: '域名无效' }
  return { ok: true, msg: '有效邮箱' }
}

export function extractEmails(text: string): string[] {
  const found = String(text || '').match(EMAIL_RE) || []
  const seen = new Set<string>()
  const out: string[] = []
  for (const e of found) {
    const lower = e.toLowerCase()
    if (seen.has(lower)) continue
    seen.add(lower)
    out.push(e)
  }
  return out
}

export function formatEmailTool(text: string, mode: 'validate' | 'extract'): string {
  if (mode === 'validate') {
    const r = validateEmail(text)
    return (r.ok ? '✓ ' : '✗ ') + r.msg + (r.ok ? '\n' + text.trim() : '')
  }
  const list = extractEmails(text)
  if (!list.length) return '未找到邮箱'
  return `共 ${list.length} 个:\n` + list.join('\n')
}
