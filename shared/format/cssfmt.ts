import beautify from 'js-beautify'

export function minifyCss(css: string): string {
  return String(css ?? '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{};,:])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n\s*/g, '')
    .trim()
}

export function formatCss(css: string, indentSize = 2): string {
  const raw = String(css ?? '').trim()
  if (!raw) throw new Error('请输入 CSS')
  const indent = indentSize < 0 || !isFinite(indentSize) ? 2 : Math.floor(indentSize)
  return beautify.css(raw, { indent_size: indent })
}

export const CSSFMT_SAMPLE = [
  '/* sample */',
  '.card{color:#333;background:#fff;padding:10px 20px;border-radius:8px}',
  '.card:hover{box-shadow:0 2px 8px rgba(0,0,0,.12)}',
  '@media (max-width:640px){.card{padding:8px}}',
].join('\n')
