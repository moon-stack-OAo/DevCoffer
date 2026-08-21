/** HTML 实体转义 / 反转义 */

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

const UNESCAPE_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&#x2F;': '/',
}

export function htmlEscape(input: string): string {
  return input.replace(/[&<>"']/g, (c) => ESCAPE_MAP[c] || c)
}

function codePointToChar(code: number, fallback: string): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return fallback
  // 代理区非法，原样保留
  if (code >= 0xd800 && code <= 0xdfff) return fallback
  try {
    return String.fromCodePoint(code)
  } catch {
    return fallback
  }
}

export function htmlUnescape(input: string): string {
  const named = input.replace(/&(?:amp|lt|gt|quot|#39|#x27|#x2F);/g, (m) => UNESCAPE_MAP[m] || m)
  return named.replace(/&#(x?[0-9a-fA-F]+);/gi, (m, body: string) => {
    const hex = body[0] === 'x' || body[0] === 'X'
    const code = hex ? parseInt(body.slice(1), 16) : parseInt(body, 10)
    return codePointToChar(code, m)
  })
}
