/** CSS clamp() 流体字号计算 */

function formatNum(n: number, digits = 4): string {
  if (!isFinite(n)) return '0'
  if (n === 0) return '0'
  if (Number.isInteger(n) || Math.abs(n - Math.round(n)) < 1e-10) return String(Math.round(n))
  let s = Number(n.toFixed(digits)).toString()
  if (/e/i.test(s)) s = n.toFixed(digits).replace(/\.?0+$/, '')
  else s = s.replace(/\.?0+$/, '')
  return s === '-0' ? '0' : s
}

export type ClampResult = {
  ok: boolean
  msg?: string
  clamp?: string
  preferred?: string
  slope?: number
  yIntercept?: number
  minFont?: number
  maxFont?: number
  minVw?: number
  maxVw?: number
}

export function cssclampCompute(minF: number, maxF: number, minV: number, maxV: number): ClampResult {
  const minFont = Number(minF)
  const maxFont = Number(maxF)
  const minVw = Number(minV)
  const maxVw = Number(maxV)
  if (![minFont, maxFont, minVw, maxVw].every((x) => isFinite(x))) {
    return { ok: false, msg: '请输入有效数字' }
  }
  if (minFont <= 0 || maxFont <= 0) return { ok: false, msg: '字号必须大于 0' }
  if (minVw <= 0 || maxVw <= 0) return { ok: false, msg: '视口宽度必须大于 0' }
  if (maxVw === minVw) return { ok: false, msg: '最大视口与最小视口不能相同' }

  if (maxFont === minFont) {
    const preferred = formatNum(minFont) + 'px'
    return {
      ok: true,
      clamp: `font-size: clamp(${formatNum(minFont)}px, ${preferred}, ${formatNum(maxFont)}px);`,
      preferred,
      slope: 0,
      yIntercept: minFont,
      minFont,
      maxFont,
      minVw,
      maxVw,
    }
  }

  const slope = (maxFont - minFont) / (maxVw - minVw)
  const yIntercept = minFont - slope * minVw
  const vwPart = slope * 100
  const yi = formatNum(yIntercept)
  const vw = formatNum(vwPart)
  let preferred: string
  if (yIntercept === 0) preferred = vw + 'vw'
  else if (vwPart >= 0) preferred = yi + 'px + ' + vw + 'vw'
  else preferred = yi + 'px - ' + formatNum(Math.abs(vwPart)) + 'vw'
  const preferredCss = 'calc(' + preferred + ')'
  return {
    ok: true,
    clamp: `font-size: clamp(${formatNum(minFont)}px, ${preferredCss}, ${formatNum(maxFont)}px);`,
    preferred: preferredCss,
    slope,
    yIntercept,
    minFont,
    maxFont,
    minVw,
    maxVw,
  }
}
