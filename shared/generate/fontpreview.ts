export const FONTPREVIEW_SUPPORTED_EXT = ['.ttf', '.otf', '.woff', '.woff2'] as const

export const FONTPREVIEW_SAMPLE_TEXTS = {
  zh:
    '永和九年，岁在癸丑。天地玄黄，宇宙洪荒。\n1234567890 ABCDEFG abcdefg\nThe quick brown fox jumps over the lazy dog.',
  en:
    'The quick brown fox jumps over the lazy dog.\nABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789 !@#$%^&*()_+-=[]{}',
  mix:
    '汉体书写信息技术标准相容\nThe quick brown fox jumps over the lazy dog.\n0123456789 AaBbCc 永字八法',
} as const

export type FontpreviewSampleKey = keyof typeof FONTPREVIEW_SAMPLE_TEXTS

export function fontpreviewIsSupportedExt(name: string | null | undefined): boolean {
  if (name == null || name === '') return false
  const lower = String(name).toLowerCase()
  return FONTPREVIEW_SUPPORTED_EXT.some((ext) => lower.endsWith(ext))
}

export function fontpreviewSampleTexts(key?: string | null): string | typeof FONTPREVIEW_SAMPLE_TEXTS {
  if (key == null || key === '') return FONTPREVIEW_SAMPLE_TEXTS
  return FONTPREVIEW_SAMPLE_TEXTS[key as FontpreviewSampleKey] || FONTPREVIEW_SAMPLE_TEXTS.mix
}

export function fontpreviewClampSize(size: number): number {
  let n = Number(size)
  if (!isFinite(n) || n < 8) n = 8
  if (n > 200) n = 200
  return n
}

export function fontpreviewClampLineHeight(lh: number): number {
  let n = Number(lh)
  if (!isFinite(n) || n < 0.8) n = 0.8
  if (n > 3) n = 3
  return n
}

export function fontpreviewFmtBytes(n: number): string {
  if (!isFinite(n) || n < 0) return '0 B'
  if (n < 1024) return Math.round(n) + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / (1024 * 1024)).toFixed(2) + ' MB'
}

export function fontpreviewFamilyCss(family: string): string {
  const name = String(family || '').trim()
  if (!name) return 'system-ui, sans-serif'
  return '"' + name.replace(/"/g, '\\"') + '", system-ui, sans-serif'
}
