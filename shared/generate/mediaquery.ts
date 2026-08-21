/** 常见 media query 生成 */

export const mediaqueryPresets = [
  { id: 'sm', name: '手机 sm', width: 640 },
  { id: 'md', name: '平板 md', width: 768 },
  { id: 'lg', name: '笔记本 lg', width: 1024 },
  { id: 'xl', name: '桌面 xl', width: 1280 },
  { id: '2xl', name: '宽屏 2xl', width: 1536 },
]

export type MediaQueryOpts = {
  direction?: 'min-width' | 'max-width'
  width?: number
  orientation?: '' | 'portrait' | 'landscape'
  body?: string
}

export function mediaqueryBuild(opts: MediaQueryOpts = {}): string {
  const direction = opts.direction === 'max-width' ? 'max-width' : 'min-width'
  let width = Number(opts.width)
  if (!isFinite(width) || width <= 0) width = 768
  width = Math.round(width)
  const parts = [`(${direction}: ${width}px)`]
  const ori = String(opts.orientation || '')
    .trim()
    .toLowerCase()
  if (ori === 'portrait' || ori === 'landscape') parts.push(`(orientation: ${ori})`)
  let body = opts.body != null && String(opts.body).trim() !== '' ? String(opts.body) : '  /* styles */'
  if (!/^\s/.test(body) && body.indexOf('\n') === -1) body = '  ' + body
  return `@media ${parts.join(' and ')} {\n${body}\n}`
}
