/** 分辨率比例计算 — 对齐旧站 generate/resratio.js */

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b) {
    const t = b
    b = a % b
    a = t
  }
  return a || 1
}

export const RESRATIO_STANDARD = [
  { w: 1, h: 1, name: '1:1 方形' },
  { w: 5, h: 4, name: '5:4 传统照片' },
  { w: 4, h: 3, name: '4:3 传统电视' },
  { w: 3, h: 2, name: '3:2 单反/全画幅' },
  { w: 16, h: 10, name: '16:10 笔记本' },
  { w: 16, h: 9, name: '16:9 HDTV / 宽屏' },
  { w: 18, h: 9, name: '18:9 手机全面屏' },
  { w: 19, h: 9, name: '19:9 iPhone' },
  { w: 21, h: 9, name: '21:9 超宽屏/电影' },
  { w: 32, h: 9, name: '32:9 超宽带鱼屏' },
] as const

export const RES_STANDARDS = [
  { w: 320, h: 240, name: 'QVGA', short: 'QVGA', desc: '早期手机 / 摄像头' },
  { w: 640, h: 480, name: 'VGA', short: 'VGA', desc: '标清' },
  { w: 720, h: 480, name: '480p / SD', short: '480p', desc: 'NTSC 标清' },
  { w: 720, h: 576, name: '576p / SD', short: '576p', desc: 'PAL 标清' },
  { w: 800, h: 600, name: 'SVGA', short: 'SVGA', desc: 'Super VGA' },
  { w: 1024, h: 768, name: 'XGA', short: 'XGA', desc: '4:3 笔记本' },
  { w: 1280, h: 720, name: 'HD 720p', short: '720p', desc: '高清' },
  { w: 1280, h: 800, name: 'WXGA', short: 'WXGA', desc: '笔记本常见' },
  { w: 1280, h: 1024, name: 'SXGA', short: 'SXGA', desc: '5:4 显示器' },
  { w: 1366, h: 768, name: 'HD+ WXGA', short: 'HD+', desc: '笔记本常见' },
  { w: 1440, h: 900, name: 'WXGA+', short: 'WXGA+', desc: '笔记本' },
  { w: 1600, h: 900, name: 'HD+', short: 'HD+', desc: 'HD+' },
  { w: 1680, h: 1050, name: 'WSXGA+', short: 'WSXGA+', desc: '笔记本' },
  { w: 1920, h: 1080, name: 'Full HD 1080p', short: '1080p', desc: '全高清' },
  { w: 1920, h: 1200, name: 'WUXGA', short: 'WUXGA', desc: 'FHD+' },
  { w: 2048, h: 1080, name: '2K DCI', short: '2K DCI', desc: '电影 2K' },
  { w: 2048, h: 1536, name: 'QXGA', short: 'QXGA', desc: 'iPad' },
  { w: 2560, h: 1080, name: 'UW-FHD', short: 'UW FHD', desc: '超宽 FHD' },
  { w: 2560, h: 1440, name: '2K / QHD', short: '2K', desc: '2K 1440p' },
  { w: 2560, h: 1600, name: 'WQXGA', short: 'WQXGA', desc: '2K+' },
  { w: 2732, h: 2048, name: 'iPad Pro', short: 'iPad Pro', desc: 'iPad Pro 12.9' },
  { w: 2880, h: 1800, name: 'Retina MacBook', short: 'MBP', desc: 'MacBook Pro' },
  { w: 3200, h: 1800, name: 'QHD+', short: 'QHD+', desc: '3K 区间' },
  { w: 3440, h: 1440, name: 'UWQHD', short: 'UWQHD', desc: '超宽 2K' },
  { w: 3840, h: 1600, name: 'UW4K', short: 'UW4K', desc: '超宽 4K' },
  { w: 3840, h: 2160, name: '4K UHD', short: '4K', desc: '4K 超高清' },
  { w: 4096, h: 2160, name: '4K DCI', short: '4K DCI', desc: '电影 4K' },
  { w: 5120, h: 2880, name: '5K', short: '5K', desc: '5K' },
  { w: 6016, h: 3384, name: '6K', short: '6K', desc: '6K' },
  { w: 7680, h: 4320, name: '8K UHD', short: '8K', desc: '8K 超高清' },
  { w: 8192, h: 4320, name: '8K DCI', short: '8K DCI', desc: '电影 8K' },
  { w: 10240, h: 4320, name: '10K', short: '10K', desc: '10K' },
] as const

export const RES_TIERS = [
  { min: 0, max: 480, name: 'SD 480p (NTSC)', short: '480p', desc: '标清' },
  { min: 481, max: 576, name: 'SD 576p (PAL)', short: '576p', desc: 'PAL 标清' },
  { min: 577, max: 720, name: 'HD 720p', short: '720p', desc: '高清区间' },
  { min: 721, max: 1280, name: 'HD+', short: 'HD+', desc: 'HD+ 区间' },
  { min: 1281, max: 1440, name: 'FHD 1080p 区间', short: '1080p', desc: '全高清区间' },
  { min: 1441, max: 1920, name: 'FHD+', short: 'FHD+', desc: 'FHD+ 区间' },
  { min: 1921, max: 2560, name: '2K / QHD 区间', short: '2K', desc: '2K 区间' },
  { min: 2561, max: 3200, name: 'QHD+', short: 'QHD+', desc: 'QHD+ 区间' },
  { min: 3201, max: 3840, name: '4K UHD 区间', short: '4K', desc: '4K 区间' },
  { min: 3841, max: 4096, name: '4K DCI 区间', short: '4K DCI', desc: '电影 4K 区间' },
  { min: 4097, max: 5120, name: '5K 区间', short: '5K', desc: '5K 区间' },
  { min: 5121, max: 7680, name: '6K-8K 之间', short: '8K', desc: '8K 区间' },
  { min: 7681, max: 8192, name: '8K UHD 区间', short: '8K UHD', desc: '8K 区间' },
  { min: 8193, max: 99999, name: '8K+', short: '8K+', desc: '高于 8K' },
] as const

/** 常用分辨率预设（与旧站面板一致） */
export const RESRATIO_PRESETS = [
  { w: 1280, h: 720, label: '720p (1280×720)' },
  { w: 1920, h: 1080, label: '1080p (1920×1080)' },
  { w: 2560, h: 1440, label: '1440p/2K (2560×1440)' },
  { w: 3840, h: 2160, label: '4K UHD (3840×2160)' },
  { w: 4096, h: 2160, label: '4K DCI (4096×2160)' },
  { w: 7680, h: 4320, label: '8K UHD (7680×4320)' },
  { w: 1366, h: 768, label: 'HD+ WXGA (1366×768)' },
  { w: 1920, h: 1200, label: 'WUXGA (1920×1200)' },
  { w: 2560, h: 1600, label: 'WQXGA (2560×1600)' },
  { w: 5120, h: 2880, label: '5K (5120×2880)' },
  { w: 6016, h: 3384, label: '6K (6016×3384)' },
  { w: 720, h: 480, label: 'SD 480p (720×480)' },
  { w: 720, h: 576, label: 'SD 576p (720×576)' },
  { w: 1024, h: 1024, label: '1:1 方形 (1024×1024)' },
  { w: 1024, h: 768, label: '4:3 (1024×768)' },
  { w: 1080, h: 720, label: '3:2 (1080×720)' },
  { w: 1280, h: 800, label: '16:10 (1280×800)' },
  { w: 2560, h: 1080, label: '21:9 (2560×1080)' },
  { w: 1179, h: 2556, label: 'iPhone 14 (1179×2556)' },
  { w: 2048, h: 2732, label: 'iPad Pro (2048×2732)' },
] as const

export const RES_BY_RATIO_OPTIONS = [
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '3:2', label: '3:2' },
  { value: '16:9', label: '16:9' },
  { value: '16:10', label: '16:10' },
  { value: '21:9', label: '21:9' },
  { value: 'custom', label: '自定义' },
] as const

export type ResStandardMatch = { w: number; h: number; name: string }

export type ResTierMatch = {
  mp: number
  category: string
  name: string
  short: string
  desc: string
  exact: boolean
  badge: string
}

export type ResRatioResult = {
  width: number
  height: number
  isInt: boolean
  ratioW: number
  ratioH: number
  ratio: string
  decimal: string
  total: number
  totalFmt: string
  mp: string
  matched: ResStandardMatch | null
  tier: ResTierMatch
}

export type ResByResult = {
  width: number
  height: number
  total: number
  totalFmt: string
  mp: string
  ratio: string
  text: string
}

export function matchStandard(w: number, h: number): ResStandardMatch | null {
  const f = w / h
  for (const r of RESRATIO_STANDARD) {
    const std = r.w / r.h
    if (Math.abs(f - std) < 0.01) return { w: r.w, h: r.h, name: r.name }
    const inv = r.h / r.w
    if (Math.abs(f - inv) < 0.01) return { w: r.h, h: r.w, name: r.name + '（纵向）' }
  }
  return null
}

export function matchTier(w: number, h: number): ResTierMatch {
  const total = w * h
  const mp = parseFloat((total / 1_000_000).toFixed(2))
  const base = { mp, category: '消费级' }

  for (const s of RES_STANDARDS) {
    if ((w === s.w && h === s.h) || (w === s.h && h === s.w)) {
      return { ...base, name: s.name, short: s.short, desc: s.desc, exact: true, badge: '✓' }
    }
  }

  const maxSide = Math.max(w, h)
  for (const t of RES_TIERS) {
    if (maxSide >= t.min && maxSide <= t.max) {
      return { ...base, name: t.name, short: t.short, desc: t.desc, exact: false, badge: '≈' }
    }
  }

  return {
    ...base,
    name: '其他 / Other',
    short: '—',
    desc: '超出常规档位',
    exact: false,
    badge: '?',
  }
}

export function computeResRatio(width: number | string, height: number | string): ResRatioResult {
  const wRaw = typeof width === 'string' ? width.trim() : String(width ?? '')
  const hRaw = typeof height === 'string' ? height.trim() : String(height ?? '')
  if (!wRaw || !hRaw) throw new Error('请输入宽和高')

  const w = parseFloat(wRaw)
  const h = parseFloat(hRaw)
  if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) {
    throw new Error('请输入有效的宽高（正整数）')
  }

  const isInt = Number.isInteger(w) && Number.isInteger(h)
  const iw = Math.round(w)
  const ih = Math.round(h)
  const g = gcd(iw, ih)
  const rw = iw / g
  const rh = ih / g
  const total = iw * ih
  const mp = (total / 1_000_000).toFixed(2)
  const totalFmt = total.toLocaleString('en-US')
  const decimal = (iw / ih).toFixed(4)
  const matched = matchStandard(iw, ih)
  const tier = matchTier(iw, ih)

  return {
    width: iw,
    height: ih,
    isInt,
    ratioW: rw,
    ratioH: rh,
    ratio: `${rw}:${rh}`,
    decimal,
    total,
    totalFmt,
    mp,
    matched,
    tier,
  }
}

/** 复制用纯文本（对齐旧站结果语义） */
export function formatResRatio(width: number | string, height: number | string): string {
  const r = computeResRatio(width, height)
  const tierLabel = r.tier.exact
    ? `${r.tier.short} / ${r.tier.name} / ${r.tier.desc}`
    : `${r.tier.name} / ${r.tier.desc}`
  const lines = [
    `${r.ratioW} : ${r.ratioH}`,
    '最简整数比例',
    `档位 ${r.tier.badge} ${tierLabel} (${r.tier.mp.toFixed(2)} MP) [${r.tier.exact ? '标准' : '区间'}]`,
    `浮点比例：${r.decimal} : 1`,
    r.matched
      ? `✓ 匹配标准比例 ${r.matched.w}:${r.matched.h}（${r.matched.name}）`
      : '非标准比例',
    `总像素数：${r.totalFmt} ≈ ${r.mp} MP`,
    `宽 × 高：${r.width} × ${r.height}`,
    '像素宽高比 (PAR)：1:1（方形像素）',
  ]
  if (!r.isInt) {
    lines.push('⚠ 检测到小数像素，最简比例基于四舍五入，结果可能偏差')
  }
  return lines.join('\n')
}

/** 按比例反算：选比例或自定义，按宽/按高 */
export function computeByRatio(opts: {
  dim: 'w' | 'h'
  base: number | string
  ratio: string
  customW?: number | string
  customH?: number | string
}): ResByResult {
  const base = parseFloat(String(opts.base ?? '').trim())
  if (!isFinite(base) || base <= 0) throw new Error('请输入有效的基准值（正数）')

  let rw: number
  let rh: number
  if (opts.ratio === 'custom') {
    rw = parseFloat(String(opts.customW ?? '').trim())
    rh = parseFloat(String(opts.customH ?? '').trim())
    if (!isFinite(rw) || !isFinite(rh) || rw <= 0 || rh <= 0) {
      throw new Error('请输入有效的自定义比例（正数）')
    }
  } else {
    const parts = opts.ratio.split(':').map(Number)
    rw = parts[0]!
    rh = parts[1]!
    if (!isFinite(rw) || !isFinite(rh) || rw <= 0 || rh <= 0) {
      throw new Error('请选择有效比例')
    }
  }

  let w: number
  let h: number
  if (opts.dim === 'w') {
    w = Math.round(base)
    h = Math.round((base * rh) / rw)
  } else {
    h = Math.round(base)
    w = Math.round((base * rw) / rh)
  }

  const total = w * h
  const mp = (total / 1_000_000).toFixed(2)
  const g = gcd(w, h)
  const ratio = `${w / g}:${h / g}`
  const totalFmt = total.toLocaleString('en-US')
  return {
    width: w,
    height: h,
    total,
    totalFmt,
    mp,
    ratio,
    text: `${w} × ${h}（像素总数 ${totalFmt} ≈ ${mp} MP，最简比例 ${ratio}）`,
  }
}

/** @deprecated 兼容旧调用：按当前分辨率缩放到目标宽/高 */
export function scaleByRatio(
  width: number,
  height: number,
  targetW?: number,
  targetH?: number,
) {
  const w = Number(width)
  const h = Number(height)
  if (!(w > 0 && h > 0)) throw new Error('请输入有效宽高')
  if (targetW && targetW > 0) {
    return { width: Math.round(targetW), height: Math.round((targetW / w) * h) }
  }
  if (targetH && targetH > 0) {
    return { width: Math.round((targetH / h) * w), height: Math.round(targetH) }
  }
  throw new Error('请指定目标宽或高')
}

/** @deprecated 兼容旧调用 */
export function calcRatio(width: number, height: number) {
  const r = computeResRatio(width, height)
  return {
    width: r.width,
    height: r.height,
    ratio: r.ratio,
    decimal: r.decimal,
    nearest: r.matched?.name || RESRATIO_STANDARD[0]!.name,
    matched: r.tier.exact ? [r.tier.name] : [],
    scaleTo1080h: Math.round((r.width / r.height) * 1080),
  }
}
