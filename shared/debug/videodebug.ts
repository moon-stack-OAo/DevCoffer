/** 视频调试：元信息格式、代理 URL、基础探测 */

import { PROXY_PATH, PROXY_HEADER, formatBytes } from '#shared/debug/httpdebug'

export { formatBytes }

export interface VdFileMeta {
  name: string
  size: number
  type: string
}

export interface VdSnapshot {
  source: string
  width: number
  height: number
  duration: number
  currentTime: number
  paused: boolean
  muted: boolean
  volume: number
  playbackRate: number
  readyState: number
  networkState: number
  error: { code: number; message: string } | null
  fileName?: string
  fileSize?: number
  mime?: string
  viaProxy?: boolean
}

export function vdFormatDuration(sec: number | null | undefined): string {
  if (sec == null || !isFinite(sec)) return '—'
  const s = Math.max(0, Number(sec))
  const totalMs = Math.round(s * 1000)
  const ms = totalMs % 1000
  const totalSec = Math.floor(totalMs / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const secPart = totalSec % 60
  const msStr = String(ms).padStart(3, '0')
  const ss = String(secPart).padStart(2, '0')
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}.${msStr}`
  return `${m}:${ss}.${msStr}`
}

export function vdFormatReadyState(n: number): string {
  const map: Record<number, string> = {
    0: 'HAVE_NOTHING',
    1: 'HAVE_METADATA',
    2: 'HAVE_CURRENT_DATA',
    3: 'HAVE_FUTURE_DATA',
    4: 'HAVE_ENOUGH_DATA',
  }
  return map[n] ?? `READY(${n})`
}

export function vdFormatNetworkState(n: number): string {
  const map: Record<number, string> = {
    0: 'NETWORK_EMPTY',
    1: 'NETWORK_IDLE',
    2: 'NETWORK_LOADING',
    3: 'NETWORK_NO_SOURCE',
  }
  return map[n] ?? `NETWORK(${n})`
}

export function vdMediaErrorMessage(code: number): string {
  const map: Record<number, string> = {
    1: '用户中止加载 (MEDIA_ERR_ABORTED)',
    2: '网络错误 (MEDIA_ERR_NETWORK)',
    3: '解码失败 (MEDIA_ERR_DECODE)',
    4: '不支持的格式/源 (MEDIA_ERR_SRC_NOT_SUPPORTED)',
  }
  return map[code] ?? `未知媒体错误 (code=${code})`
}

export function vdProxyUrl(url: string): string {
  return PROXY_PATH + '?target=' + encodeURIComponent(url)
}

export function vdIsCrossOrigin(url: string, origin?: string): boolean {
  try {
    if (!url) return true
    if (/^blob:|^data:/i.test(url)) return false
    const base =
      origin ||
      (typeof location !== 'undefined' ? location.href : 'https://local.invalid/')
    const u = new URL(url, base)
    const cur =
      origin ||
      (typeof location !== 'undefined' ? location.origin : 'https://local.invalid')
    return u.origin !== cur
  } catch {
    return true
  }
}

export async function vdProbeCorsProxy(): Promise<boolean> {
  try {
    const resp = await fetch(PROXY_PATH, { method: 'GET', cache: 'no-store' })
    const by = (resp.headers.get('x-proxied-by') || '').toLowerCase()
    if (by.includes(PROXY_HEADER)) return true
    const ct = (resp.headers.get('content-type') || '').toLowerCase()
    if (ct.includes('text/html')) return false
    if (resp.status === 400) {
      const t = await resp.text()
      return typeof t === 'string' && /Missing target/i.test(t) && !ct.includes('text/html')
    }
    return false
  } catch {
    return false
  }
}

export function vdParseVideoSnapshot(
  video: HTMLVideoElement | null,
  extra?: Partial<VdSnapshot>,
): VdSnapshot {
  if (!video) {
    return {
      source: '',
      width: 0,
      height: 0,
      duration: NaN,
      currentTime: 0,
      paused: true,
      muted: false,
      volume: 1,
      playbackRate: 1,
      readyState: 0,
      networkState: 0,
      error: null,
      ...extra,
    }
  }
  let err: VdSnapshot['error'] = null
  if (video.error) {
    err = {
      code: video.error.code,
      message: video.error.message || vdMediaErrorMessage(video.error.code),
    }
  }
  return {
    source: video.currentSrc || video.src || '',
    width: video.videoWidth || 0,
    height: video.videoHeight || 0,
    duration: video.duration,
    currentTime: video.currentTime || 0,
    paused: !!video.paused,
    muted: !!video.muted,
    volume: video.volume != null ? video.volume : 1,
    playbackRate: video.playbackRate != null ? video.playbackRate : 1,
    readyState: video.readyState != null ? video.readyState : 0,
    networkState: video.networkState != null ? video.networkState : 0,
    error: err,
    ...extra,
  }
}

export function vdBuildMediaInfo(meta: Partial<VdSnapshot> & { source?: string }): string {
  const lines: string[] = []
  lines.push('来源: ' + (meta.source || '—'))
  if (meta.fileName) lines.push('文件名: ' + meta.fileName)
  if (meta.fileSize != null && meta.fileSize !== ('' as unknown as number)) {
    lines.push('文件大小: ' + formatBytes(Number(meta.fileSize)))
  }
  if (meta.mime) lines.push('MIME: ' + meta.mime)
  if (meta.viaProxy) lines.push('加载方式: 同源代理 (/__cors_proxy)')
  lines.push(
    '分辨率: ' + (meta.width && meta.height ? `${meta.width} × ${meta.height}` : '—'),
  )
  lines.push('时长: ' + vdFormatDuration(meta.duration))
  lines.push('当前时间: ' + vdFormatDuration(meta.currentTime))
  lines.push('状态: ' + (meta.paused ? '暂停' : '播放中'))
  lines.push('静音: ' + (meta.muted ? '是' : '否'))
  lines.push(
    '音量: ' +
      (meta.volume != null && isFinite(meta.volume)
        ? Math.round(meta.volume * 100) + '%'
        : '—'),
  )
  lines.push(
    '倍速: ' +
      (meta.playbackRate != null && isFinite(meta.playbackRate)
        ? meta.playbackRate + 'x'
        : '—'),
  )
  lines.push(
    'readyState: ' +
      meta.readyState +
      ' (' +
      vdFormatReadyState(meta.readyState ?? 0) +
      ')',
  )
  lines.push(
    'networkState: ' +
      meta.networkState +
      ' (' +
      vdFormatNetworkState(meta.networkState ?? 0) +
      ')',
  )
  if (meta.error) {
    const em =
      typeof meta.error === 'object'
        ? meta.error.message || vdMediaErrorMessage(meta.error.code)
        : String(meta.error)
    lines.push('错误: ' + em)
  } else {
    lines.push('错误: 无')
  }
  return lines.join('\n')
}

export function vdLooksLikePlaylistUrl(url: string): boolean {
  const u = String(url || '')
    .split('#')[0]
    .split('?')[0]
    .toLowerCase()
  return /\.m3u8?$/i.test(u)
}

export type VdChannel = {
  title: string
  group: string
  logo: string
  url: string
  duration: number
  attrs: Record<string, string>
}

export type VdM3uParsed = {
  header: Record<string, string>
  items: VdChannel[]
}

export type VdCaptureCheck =
  | { ok: true; width: number; height: number; time: number }
  | { ok: false; error: string }

export type VdLogLevel = 'info' | 'warn' | 'error' | 'system'

export function vdValidateCaptureSource(video: HTMLVideoElement | null): VdCaptureCheck {
  if (!video) return { ok: false, error: '无视频元素' }
  const w = video.videoWidth || 0
  const h = video.videoHeight || 0
  if (!w || !h) return { ok: false, error: '视频尚未就绪或无有效画面尺寸' }
  return { ok: true, width: w, height: h, time: video.currentTime || 0 }
}

export function vdLooksLikeM3u(text: string): boolean {
  if (!text || typeof text !== 'string') return false
  const t = text.replace(/^\uFEFF/, '').trim()
  if (!t) return false
  if (/^#EXTM3U/im.test(t)) return true
  if (/#EXTINF\s*:/i.test(t) && /https?:\/\//i.test(t)) return true
  return false
}

export function vdLooksLikeHlsMediaPlaylist(text: string): boolean {
  if (!text || typeof text !== 'string') return false
  if (/#EXT-X-TARGETDURATION/i.test(text)) return true
  if (/#EXT-X-STREAM-INF/i.test(text)) return true
  if (/#EXT-X-MEDIA-SEQUENCE/i.test(text)) return true
  if (/#EXTINF\s*:/i.test(text) && /\.ts(\?|$)/im.test(text)) return true
  if (/#EXTINF\s*:/i.test(text) && /#EXT-X-ENDLIST/i.test(text)) return true
  return false
}

export function vdUrlPlaylistHint(url: string): { isM3u: boolean; isM3u8: boolean } {
  const u = String(url || '').split('#')[0]!.split('?')[0]!.toLowerCase()
  return { isM3u: /\.m3u$/i.test(u), isM3u8: /\.m3u8$/i.test(u) }
}

export function vdParseExtinf(line: string): {
  duration: number
  title: string
  attrs: Record<string, string>
} {
  const raw = String(line || '')
  const m = raw.match(/^#EXTINF\s*:\s*(-?\d+(?:\.\d+)?)?\s*(.*)$/i)
  if (!m) return { duration: -1, title: '', attrs: {} }
  const duration = m[1] != null && m[1] !== '' ? parseFloat(m[1]) : -1
  const rest = (m[2] || '').trim()
  let title = ''
  let attrPart = rest
  const comma = rest.lastIndexOf(',')
  if (comma >= 0) {
    attrPart = rest.slice(0, comma).trim()
    title = rest.slice(comma + 1).trim()
  }
  const attrs: Record<string, string> = {}
  const re = /([A-Za-z0-9_-]+)="([^"]*)"/g
  let am: RegExpExecArray | null
  while ((am = re.exec(attrPart))) {
    attrs[am[1]!.toLowerCase()] = am[2]!
  }
  return { duration: isFinite(duration) ? duration : -1, title, attrs }
}

export function vdResolveUrl(baseUrl: string, ref: string): string {
  const r = String(ref || '').trim()
  if (!r) return ''
  if (/^https?:\/\//i.test(r) || /^blob:/i.test(r) || /^data:/i.test(r)) return r
  try {
    return new URL(r, baseUrl || 'https://local.invalid/').href
  } catch {
    return r
  }
}

export function vdParseM3u(text: string, baseUrl = ''): VdM3uParsed {
  const raw = String(text || '').replace(/^\uFEFF/, '')
  const lines = raw.split(/\r?\n/)
  const header: Record<string, string> = {}
  const items: VdChannel[] = []
  let pending: ReturnType<typeof vdParseExtinf> | null = null
  for (const lineRaw of lines) {
    const line = lineRaw.trim()
    if (!line) continue
    if (line.charAt(0) === '#') {
      if (/^#EXTM3U/i.test(line)) {
        const hm = line.match(/([A-Za-z0-9_-]+)="([^"]*)"/g)
        if (hm) {
          hm.forEach((pair) => {
            const pm = pair.match(/([A-Za-z0-9_-]+)="([^"]*)"/)
            if (pm) header[pm[1]!.toLowerCase()] = pm[2]!
          })
        }
        continue
      }
      if (/^#EXTINF/i.test(line)) {
        pending = vdParseExtinf(line)
        continue
      }
      continue
    }
    const url = vdResolveUrl(baseUrl, line)
    if (!url) continue
    const attrs = (pending && pending.attrs) || {}
    let title = (pending && pending.title) || ''
    if (!title) title = attrs['tvg-name'] || attrs['tvg-id'] || '频道 ' + (items.length + 1)
    items.push({
      title,
      group: attrs['group-title'] || attrs.group || '',
      logo: attrs['tvg-logo'] || attrs.logo || '',
      url,
      duration: pending ? pending.duration : -1,
      attrs,
    })
    pending = null
  }
  return { header, items }
}

export function vdIsChannelPlaylist(parsed: VdM3uParsed, text: string): boolean {
  if (!parsed?.items?.length) return false
  if (vdLooksLikeHlsMediaPlaylist(text)) return false
  return true
}

export function vdFilterChannels(items: VdChannel[], filterText: string): VdChannel[] {
  const q = String(filterText || '').trim().toLowerCase()
  if (!q) return items
  return items.filter((ch) => {
    const hay = [ch.title, ch.group, ch.url].join(' ').toLowerCase()
    return hay.includes(q)
  })
}

export function vdApplyVideoCorsMode(video: HTMLVideoElement, srcUrl: string) {
  const same =
    !srcUrl ||
    /^blob:|^data:/i.test(srcUrl) ||
    !vdIsCrossOrigin(srcUrl) ||
    srcUrl.indexOf('/__cors_proxy') === 0
  if (same) {
    video.crossOrigin = 'anonymous'
  } else {
    try {
      video.removeAttribute('crossorigin')
    } catch {
      /* ignore */
    }
  }
}

export function vdFormatTimeRanges(tr: TimeRanges | null | undefined): string {
  if (!tr || !tr.length) return '—'
  const parts: string[] = []
  for (let i = 0; i < tr.length; i++) {
    parts.push(vdFormatDuration(tr.start(i)) + '–' + vdFormatDuration(tr.end(i)))
  }
  return parts.join(', ')
}
