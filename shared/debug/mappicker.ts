/** 地图选址 mappicker — 纯函数 */

export const DEFAULT_CENTER: [number, number] = [35.0, 105.0]
export const DEFAULT_ZOOM = 4
export const DEFAULT_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
export const DEFAULT_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
export const GEO_SAMPLE_MS = 8000
export const GEO_GOOD_ACC_M = 25

export type TileNormalizeOk = {
  ok: true
  url: string
  options: { maxZoom: number; attribution: string; subdomains?: string[] }
  subdomains: string[] | null
}

export type TileNormalizeErr = { ok: false; error: string }

export type CoordParseOk = {
  ok: true
  lat: number
  lng: number
  order: 'latlng' | 'lnglat'
}

export type CoordParseErr = { ok: false; error: string }

export function mpNormalizeTileTemplate(
  url: string | null | undefined,
): TileNormalizeOk | TileNormalizeErr {
  const raw = url == null ? '' : String(url).trim()
  if (!raw) {
    return { ok: false, error: '请输入瓦片 URL 模板' }
  }
  let template = raw
  let subdomains: string[] | null = null

  const numM = template.match(/\{(\d+)-(\d+)\}/)
  if (numM) {
    const nStart = parseInt(numM[1]!, 10)
    const nEnd = parseInt(numM[2]!, 10)
    if (!isFinite(nStart) || !isFinite(nEnd) || nEnd < nStart || nEnd - nStart > 36) {
      return { ok: false, error: '子域区间无效: ' + numM[0] }
    }
    subdomains = []
    for (let i = nStart; i <= nEnd; i++) {
      subdomains.push(String(i))
    }
    template = template.replace(numM[0]!, '{s}')
  } else {
    const letM = template.match(/\{([a-z])-([a-z])\}/i)
    if (letM) {
      const c0 = letM[1]!.toLowerCase().charCodeAt(0)
      const c1 = letM[2]!.toLowerCase().charCodeAt(0)
      if (c1 < c0 || c1 - c0 > 26) {
        return { ok: false, error: '子域区间无效: ' + letM[0] }
      }
      subdomains = []
      for (let c = c0; c <= c1; c++) {
        subdomains.push(String.fromCharCode(c))
      }
      template = template.replace(letM[0]!, '{s}')
    }
  }

  if (template.indexOf('{z}') < 0 || template.indexOf('{x}') < 0 || template.indexOf('{y}') < 0) {
    return { ok: false, error: '模板须包含 {z}/{x}/{y}' }
  }

  const leftover = template.match(/\{(?![sxyzr]\})[^}]+\}/i)
  if (leftover) {
    return {
      ok: false,
      error: '不支持的模板变量 ' + leftover[0] + '（子域请用 {1-4}/{a-d} 或 {s}）',
    }
  }

  const opts: TileNormalizeOk['options'] = { maxZoom: 19, attribution: DEFAULT_ATTR }
  if (subdomains && subdomains.length) {
    opts.subdomains = subdomains
  } else if (template.indexOf('{s}') >= 0) {
    opts.subdomains = ['a', 'b', 'c']
  }

  return { ok: true, url: template, options: opts, subdomains }
}

export function mpClampLat(lat: unknown): number {
  const n = Number(lat)
  if (!isFinite(n)) return NaN
  if (n > 90) return 90
  if (n < -90) return -90
  return n
}

export function mpClampLng(lng: unknown): number {
  const n = Number(lng)
  if (!isFinite(n)) return NaN
  if (n > 180) return 180
  if (n < -180) return -180
  return n
}

export function mpIsValidLatLng(lat: unknown, lng: unknown): boolean {
  const la = Number(lat)
  const ln = Number(lng)
  return isFinite(la) && isFinite(ln) && la >= -90 && la <= 90 && ln >= -180 && ln <= 180
}

export function mpParseCoordInput(text: unknown): CoordParseOk | CoordParseErr {
  if (text == null || String(text).trim() === '') {
    return { ok: false, error: '请输入坐标' }
  }
  const raw = String(text)
    .trim()
    .replace(/[，；;|/]/g, ',')
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  if (parts.length < 2) {
    return { ok: false, error: '格式应为 纬度,经度 或 经度,纬度' }
  }
  const a = Number(parts[0])
  const b = Number(parts[1])
  if (!isFinite(a) || !isFinite(b)) {
    return { ok: false, error: '坐标必须为数字' }
  }

  let lat: number
  let lng: number
  let order: 'latlng' | 'lnglat'
  if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
    lat = a
    lng = b
    order = 'latlng'
  } else if (Math.abs(a) > 90 && Math.abs(a) <= 180 && Math.abs(b) <= 90) {
    lng = a
    lat = b
    order = 'lnglat'
  } else if (Math.abs(b) > 90 && Math.abs(b) <= 180 && Math.abs(a) <= 90) {
    lat = a
    lng = b
    order = 'latlng'
  } else {
    return { ok: false, error: '坐标超出有效范围（lat ±90，lng ±180）' }
  }

  if (!mpIsValidLatLng(lat, lng)) {
    return { ok: false, error: '坐标超出有效范围（lat ±90，lng ±180）' }
  }
  return { ok: true, lat, lng, order }
}

export function mpFormatLatLng(
  lat: number,
  lng: number,
  decimals?: number | null,
  order?: 'latlng' | 'lnglat',
): string {
  let d = decimals == null ? 6 : Number(decimals)
  if (!isFinite(d) || d < 0) d = 6
  d = Math.min(12, Math.floor(d))
  const la = Number(lat).toFixed(d)
  const ln = Number(lng).toFixed(d)
  if (order === 'lnglat') return ln + ',' + la
  return la + ',' + ln
}

export function mpFormatJson(lat: number, lng: number, decimals?: number | null): string {
  let d = decimals == null ? 6 : Number(decimals)
  if (!isFinite(d) || d < 0) d = 6
  d = Math.min(12, Math.floor(d))
  const la = Number(Number(lat).toFixed(d))
  const ln = Number(Number(lng).toFixed(d))
  return JSON.stringify({ lat: la, lng: ln })
}

export function mpFormatAccuracy(m: number | null | undefined): string {
  if (m == null || !isFinite(m) || m < 0) return '—'
  if (m < 1000) return '±' + Math.round(m) + ' m'
  return '±' + (m / 1000).toFixed(1) + ' km'
}

export function mpZoomForAccuracy(accuracy: number | null | undefined): number {
  if (accuracy == null || !isFinite(accuracy)) return 16
  if (accuracy <= 20) return 18
  if (accuracy <= 50) return 17
  if (accuracy <= 100) return 16
  if (accuracy <= 300) return 15
  if (accuracy <= 1000) return 14
  return 13
}

export function mpGeoErrorMessage(err: GeolocationPositionError | null | undefined): string {
  if (!err) return '定位失败'
  if (err.code === 1) return '定位被拒绝，请在浏览器中允许位置权限'
  if (err.code === 2) return '暂时无法获取位置'
  if (err.code === 3) return '定位超时，请重试'
  return err.message ? String(err.message) : '定位失败'
}
