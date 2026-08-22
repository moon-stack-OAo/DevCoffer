<script setup lang="ts">
import {
  vdApplyVideoCorsMode,
  vdBuildMediaInfo,
  vdFilterChannels,
  vdFormatDuration,
  vdIsChannelPlaylist,
  vdIsCrossOrigin,
  vdLooksLikeM3u,
  vdLooksLikePlaylistUrl,
  vdParseM3u,
  vdParseVideoSnapshot,
  vdProbeCorsProxy,
  vdProxyUrl,
  vdUrlPlaylistHint,
  vdValidateCaptureSource,
  type VdChannel,
  type VdFileMeta,
  type VdLogLevel,
} from '#shared/debug/videodebug'

type HlsNS = typeof import('hls.js').default
type HlsInstance = InstanceType<HlsNS>

const urlInput = ref('')
const useProxy = ref(false)
const proxyAvailable = ref<boolean | null>(null)
const status = ref('未加载')
const info = ref('—')
const videoRef = ref<HTMLVideoElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const rate = ref(1)
const loop = ref(false)
const channelFilter = ref('')
const channels = ref<VdChannel[]>([])
const selectedChannelUrl = ref('')
const logs = ref<{ id: number; t: string; level: VdLogLevel; msg: string }[]>([])
const shotUrl = ref('')
const shotMeta = ref('')

let objectUrl: string | null = null
let fileMeta: VdFileMeta | null = null
let activeUrl = ''
let viaProxy = false
let playMode: 'direct' | 'hls' | 'hls-native' | 'playlist' = 'direct'
let hlsInst: HlsInstance | null = null
let HlsCtor: HlsNS | null = null
let logSeq = 0
let lastFrame: { dataUrl: string; blob: Blob | null; width: number; height: number; time: number } | null =
  null
let lastInfoAt = 0

const { error, setError, clearError } = useToolState()
const { copy } = useClipboard()

const filteredChannels = computed(() => vdFilterChannels(channels.value, channelFilter.value))

function addLog(level: VdLogLevel, msg: string) {
  logs.value.push({
    id: ++logSeq,
    t: new Date().toLocaleTimeString(),
    level,
    msg,
  })
  if (logs.value.length > 300) logs.value = logs.value.slice(-250)
}

function clearLog() {
  logs.value = []
}

function copyLog() {
  const text = logs.value.map((l) => `[${l.t}] ${l.level}: ${l.msg}`).join('\n')
  copy(text || '(空)')
}

function revokeObjectUrl() {
  if (objectUrl) {
    try {
      URL.revokeObjectURL(objectUrl)
    } catch {
      /* ignore */
    }
    objectUrl = null
  }
}

function destroyHls() {
  if (hlsInst) {
    try {
      hlsInst.destroy()
    } catch {
      /* ignore */
    }
    hlsInst = null
  }
}

function refreshInfo() {
  const v = videoRef.value
  const snap = vdParseVideoSnapshot(v, {
    fileName: fileMeta?.name,
    fileSize: fileMeta?.size,
    mime: fileMeta?.type,
    viaProxy,
    source: activeUrl || v?.currentSrc || v?.src || '',
  })
  let text = vdBuildMediaInfo(snap)
  text += '\n播放模式: ' + playMode
  if (v?.buffered) {
    try {
      const parts: string[] = []
      for (let i = 0; i < v.buffered.length; i++) {
        parts.push(vdFormatDuration(v.buffered.start(i)) + '–' + vdFormatDuration(v.buffered.end(i)))
      }
      text += '\n缓冲: ' + (parts.join(', ') || '—')
    } catch {
      /* ignore */
    }
  }
  info.value = text
}

function clearMedia() {
  destroyHls()
  const v = videoRef.value
  if (v) {
    try {
      v.pause()
    } catch {
      /* ignore */
    }
    v.removeAttribute('src')
    try {
      v.load()
    } catch {
      /* ignore */
    }
  }
  revokeObjectUrl()
  fileMeta = null
  activeUrl = ''
  viaProxy = false
  channels.value = []
  selectedChannelUrl.value = ''
  if (shotUrl.value) {
    URL.revokeObjectURL(shotUrl.value)
    shotUrl.value = ''
  }
  shotMeta.value = ''
  lastFrame = null
}

async function ensureProxyProbed() {
  if (proxyAvailable.value !== null) return proxyAvailable.value
  const ok = await vdProbeCorsProxy()
  proxyAvailable.value = ok
  return ok
}

async function loadHlsModule() {
  if (HlsCtor) return HlsCtor
  const mod = await import('hls.js')
  HlsCtor = (mod.default || mod) as HlsNS
  return HlsCtor
}

function createProxiedLoader(Hls: HlsNS) {
  const Base = Hls.DefaultConfig?.loader
  if (!Base) return undefined
  return class ProxiedLoader extends Base {
    override load(context: { url: string }, config: unknown, callbacks: unknown) {
      if (context?.url && vdIsCrossOrigin(context.url)) {
        context.url = vdProxyUrl(context.url)
      }
      // @ts-expect-error hls loader signature
      super.load(context, config, callbacks)
    }
  }
}

async function attachHls(url: string, video: HTMLVideoElement): Promise<boolean> {
  destroyHls()
  const Hls = await loadHlsModule()
  if (Hls.isSupported()) {
    let wantProxy = useProxy.value || (vdIsCrossOrigin(url) && proxyAvailable.value === true)
    if (wantProxy) {
      const ok = await ensureProxyProbed()
      if (!ok) wantProxy = false
      else {
        viaProxy = true
        addLog('info', 'HLS 经同源代理加载清单/分片')
      }
    }
    const hlsOpts: Record<string, unknown> = { enableWorker: true, lowLatencyMode: false }
    if (wantProxy) {
      const ProxiedLoader = createProxiedLoader(Hls)
      if (ProxiedLoader) hlsOpts.loader = ProxiedLoader
      hlsOpts.fetchSetup = (context: { url: string }, initParams: RequestInit) => {
        if (context?.url && vdIsCrossOrigin(context.url)) context.url = vdProxyUrl(context.url)
        return new Request(context.url, initParams || {})
      }
    }
    const hls = new Hls(hlsOpts as never)
    hlsInst = hls
    hls.on(Hls.Events.ERROR, (_e, data) => {
      if (!data) return
      const msg = (data.type || 'error') + ' ' + (data.details || '')
      if (data.fatal) {
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && !viaProxy && vdIsCrossOrigin(url)) {
          addLog('warn', 'HLS 网络错误，尝试同源代理…')
          ensureProxyProbed().then((ok) => {
            if (!ok) {
              addLog('error', 'HLS fatal: ' + msg + '（无 /__cors_proxy）')
              status.value = 'HLS 错误'
              setError('跨域流被拦截且无本地代理')
              return
            }
            useProxy.value = true
            viaProxy = true
            destroyHls()
            attachHls(url, video)
          })
          return
        }
        addLog('error', 'HLS fatal: ' + msg)
        status.value = 'HLS 错误'
        setError('HLS 播放失败: ' + (data.details || data.type))
        try {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad()
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError()
        } catch {
          /* ignore */
        }
      } else {
        addLog('warn', 'HLS: ' + msg)
      }
    })
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      addLog('info', 'HLS manifest 已解析')
      status.value = '已加载'
      video.play()?.catch(() => {})
      refreshInfo()
    })
    hls.loadSource(url)
    hls.attachMedia(video)
    playMode = 'hls'
    activeUrl = url
    return true
  }
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    let nativeSrc = url
    if (useProxy.value && vdIsCrossOrigin(url)) {
      const ok = await ensureProxyProbed()
      if (ok) {
        nativeSrc = vdProxyUrl(url)
        viaProxy = true
      }
    }
    vdApplyVideoCorsMode(video, nativeSrc)
    video.src = nativeSrc
    video.load()
    playMode = 'hls-native'
    activeUrl = url
    return true
  }
  return false
}

async function playMediaUrl(url: string, opts: { forceHls?: boolean } = {}) {
  const video = videoRef.value
  if (!video || !url) return
  destroyHls()
  try {
    video.pause()
  } catch {
    /* ignore */
  }
  video.removeAttribute('src')

  const hint = vdUrlPlaylistHint(url)
  const wantHls = opts.forceHls || hint.isM3u8
  if (wantHls) {
    if (await attachHls(url, video)) {
      status.value = '加载中…'
      addLog('info', 'HLS 加载: ' + url)
      refreshInfo()
      return
    }
    addLog('warn', '当前环境无 hls.js 且不支持原生 HLS，尝试直链')
  }

  let playUrl = url
  if (
    vdIsCrossOrigin(url) &&
    (useProxy.value || proxyAvailable.value === true) &&
    !/^blob:|^data:/i.test(url)
  ) {
    const ok = await ensureProxyProbed()
    if (ok) {
      playUrl = vdProxyUrl(url)
      viaProxy = true
      useProxy.value = true
      addLog('info', '直链经同源代理加载')
    }
  }
  vdApplyVideoCorsMode(video, playUrl)
  video.src = playUrl
  video.load()
  playMode = 'direct'
  activeUrl = url
  status.value = '加载中…'
  addLog('info', '直链加载: ' + url)
  refreshInfo()
}

async function applyPlaylistText(text: string, baseUrl: string, label: string) {
  if (!vdLooksLikeM3u(text)) {
    setError('不是有效的 M3U 播放列表')
    return
  }
  const parsed = vdParseM3u(text, baseUrl)
  if (vdIsChannelPlaylist(parsed, text)) {
    channels.value = parsed.items
    selectedChannelUrl.value = ''
    playMode = 'playlist'
    status.value = '频道列表 ' + parsed.items.length
    addLog('info', label + '：解析到 ' + parsed.items.length + ' 个频道')
    return
  }
  // HLS media playlist → 交给 hls
  channels.value = []
  await playMediaUrl(baseUrl || urlInput.value.trim(), { forceHls: true })
}

async function loadUrl() {
  clearError()
  const url = urlInput.value.trim()
  if (!url) {
    setError('请输入视频 / M3U URL')
    return
  }
  const video = videoRef.value
  if (!video) return
  clearMedia()
  status.value = '加载中…'
  fileMeta = null

  const hint = vdUrlPlaylistHint(url)
  if (hint.isM3u && !hint.isM3u8) {
    try {
      let fetchUrl = url
      if (vdIsCrossOrigin(url) && (useProxy.value || true)) {
        const ok = await ensureProxyProbed()
        if (ok) {
          fetchUrl = vdProxyUrl(url)
          viaProxy = true
        }
      }
      const resp = await fetch(fetchUrl)
      const text = await resp.text()
      await applyPlaylistText(text, url, 'M3U')
      return
    } catch (e) {
      setError('拉取 M3U 失败: ' + (e instanceof Error ? e.message : String(e)))
      addLog('error', '拉取 M3U 失败')
      return
    }
  }

  if (hint.isM3u8 || vdLooksLikePlaylistUrl(url)) {
    await playMediaUrl(url, { forceHls: true })
    return
  }
  await playMediaUrl(url)
}

function selectChannel(ch: VdChannel) {
  selectedChannelUrl.value = ch.url
  clearError()
  const hint = vdUrlPlaylistHint(ch.url)
  playMediaUrl(ch.url, { forceHls: hint.isM3u8 })
  addLog('info', '切换频道: ' + ch.title)
}

function onFile(e: Event) {
  clearError()
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  clearMedia()
  objectUrl = URL.createObjectURL(file)
  fileMeta = { name: file.name, size: file.size, type: file.type }
  const v = videoRef.value
  if (!v) return
  vdApplyVideoCorsMode(v, objectUrl)
  v.src = objectUrl
  v.load()
  playMode = 'direct'
  activeUrl = objectUrl
  status.value = '本地文件'
  addLog('info', '本地文件: ' + file.name)
  refreshInfo()
}

function capture() {
  clearError()
  const v = videoRef.value
  const check = vdValidateCaptureSource(v)
  if (!check.ok) {
    setError(check.error)
    return
  }
  try {
    const canvas = document.createElement('canvas')
    canvas.width = check.width
    canvas.height = check.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(v!, 0, 0, check.width, check.height)
    const dataUrl = canvas.toDataURL('image/png')
    lastFrame = { dataUrl, blob: null, width: check.width, height: check.height, time: check.time }
    if (shotUrl.value) URL.revokeObjectURL(shotUrl.value)
    shotUrl.value = dataUrl
    shotMeta.value = check.width + '×' + check.height + ' @ ' + vdFormatDuration(check.time)
    canvas.toBlob((blob) => {
      if (blob && lastFrame) lastFrame.blob = blob
    }, 'image/png')
    addLog('info', '截帧 ' + shotMeta.value)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    setError('截帧失败（可能跨域污染画布）: ' + msg)
    addLog('error', '截帧失败: ' + msg)
  }
}

function downloadFrame() {
  if (!lastFrame?.dataUrl) {
    setError('请先截帧')
    return
  }
  const name = 'frame-' + vdFormatDuration(lastFrame.time).replace(/:/g, '-') + '.png'
  const a = document.createElement('a')
  if (lastFrame.blob) {
    a.href = URL.createObjectURL(lastFrame.blob)
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  } else {
    a.href = lastFrame.dataUrl
    a.download = name
    a.click()
  }
  addLog('info', '已下载 ' + name)
}

function resetAll() {
  clearMedia()
  urlInput.value = ''
  status.value = '未加载'
  info.value = '—'
  clearError()
  addLog('system', '已重置')
}

function onRate() {
  const v = videoRef.value
  if (v) v.playbackRate = rate.value
  refreshInfo()
}
function onLoop() {
  const v = videoRef.value
  if (v) v.loop = loop.value
}

function bindEvents(v: HTMLVideoElement) {
  const events = [
    'loadstart',
    'loadedmetadata',
    'loadeddata',
    'canplay',
    'playing',
    'pause',
    'waiting',
    'seeking',
    'seeked',
    'ended',
    'error',
    'stalled',
    'suspend',
  ]
  for (const ev of events) {
    v.addEventListener(ev, () => {
      if (ev === 'error') {
        const code = v.error?.code
        addLog('error', 'video error' + (code ? ' code=' + code : ''))
        status.value = '错误'
      } else if (ev === 'waiting') {
        addLog('warn', 'waiting')
      } else if (ev === 'playing') {
        status.value = '播放中'
        addLog('info', 'playing')
      } else if (ev === 'pause') {
        status.value = '暂停'
      } else if (ev === 'loadedmetadata' || ev === 'canplay') {
        status.value = '已加载'
        addLog('info', ev)
      } else {
        const now = Date.now()
        if (now - lastInfoAt > 250) {
          lastInfoAt = now
          addLog('info', ev)
        }
      }
      refreshInfo()
    })
  }
}

onMounted(async () => {
  if (videoRef.value) bindEvents(videoRef.value)
  const ok = await ensureProxyProbed()
  if (ok) useProxy.value = true
})

onBeforeUnmount(() => {
  clearMedia()
})

watch(rate, onRate)
watch(loop, onLoop)
</script>

<template>
  <UiToolShell title="视频调试" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="loadUrl">加载 URL</button>
      <button type="button" class="btn btn-ghost" @click="fileInputRef?.click()">本地文件</button>
      <button type="button" class="btn btn-ghost" @click="capture">截帧</button>
      <button type="button" class="btn btn-ghost" @click="downloadFrame">下载截帧</button>
      <button type="button" class="btn btn-ghost" @click="resetAll">重置</button>
    </template>

    <template #toolbar>
      <div class="top">
        <input
          v-model="urlInput"
          class="inp grow"
          placeholder="https://…/video.mp4 或 .m3u8 / .m3u"
          @keydown.enter.prevent="loadUrl"
        />
        <label class="chk">
          <input v-model="useProxy" type="checkbox" :disabled="proxyAvailable === false" />
          同源代理
          <span v-if="proxyAvailable === true" class="ok">可用</span>
          <span v-else-if="proxyAvailable === false" class="no">不可用</span>
        </label>
        <label class="chk">倍速
          <select v-model.number="rate" class="sel">
            <option :value="0.5">0.5x</option>
            <option :value="1">1x</option>
            <option :value="1.25">1.25x</option>
            <option :value="1.5">1.5x</option>
            <option :value="2">2x</option>
          </select>
        </label>
        <label class="chk"><input v-model="loop" type="checkbox" /> 循环</label>
        <span class="status">{{ status }}</span>
      </div>
      <p class="hint">支持直链 / HLS(m3u8) / M3U 频道列表；跨域可走 /__cors_proxy</p>
      <input ref="fileInputRef" type="file" accept="video/*,.m3u,.m3u8" class="hidden" @change="onFile" />
    </template>

    <div class="vd-layout">
      <div class="player-col">
        <video ref="videoRef" class="vid" controls playsinline />
        <div v-if="channels.length" class="channels">
          <div class="ch-head">
            <span>频道 ({{ filteredChannels.length }}/{{ channels.length }})</span>
            <input v-model="channelFilter" class="inp" placeholder="筛选…" style="width: 140px" />
          </div>
          <div class="ch-list">
            <button
              v-for="(ch, i) in filteredChannels"
              :key="ch.url + i"
              type="button"
              class="ch-item"
              :class="{ active: selectedChannelUrl === ch.url }"
              @click="selectChannel(ch)"
            >
              <span class="ch-title">{{ ch.title }}</span>
              <span v-if="ch.group" class="ch-group">{{ ch.group }}</span>
            </button>
          </div>
        </div>
        <div v-if="shotUrl" class="shot">
          <img :src="shotUrl" alt="视频播放器当前画面截帧" />
          <div class="shot-meta">{{ shotMeta }}</div>
        </div>
      </div>
      <div class="side-col">
        <label class="lbl">媒体信息</label>
        <pre class="info">{{ info }}</pre>
        <div class="log-head">
          <label class="lbl">事件日志</label>
          <div>
            <button type="button" class="btn btn-ghost sm" @click="copyLog">复制</button>
            <button type="button" class="btn btn-ghost sm" @click="clearLog">清空</button>
          </div>
        </div>
        <div class="log">
          <div v-for="l in logs" :key="l.id" class="log-line" :class="l.level">
            <span class="t">{{ l.t }}</span> {{ l.msg }}
          </div>
          <div v-if="!logs.length" class="hint">暂无日志</div>
        </div>
      </div>
    </div>
  </UiToolShell>
</template>

<style scoped>
.top {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.grow {
  flex: 1;
  min-width: 200px;
}
.chk {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
}
.sel {
  width: 72px;
}
.status {
  font-size: 12px;
  color: var(--accent, #818cf8);
}
.ok {
  color: #34d399;
}
.no {
  color: #f87171;
}
.hint {
  font-size: 12px;
  color: var(--text-muted);
  margin: 6px 0 0;
}
.hidden {
  display: none;
}
.vd-layout {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
  align-self: stretch;
  height: 100%;
  align-items: stretch;
  width: 100%;
}
@media (max-width: 900px) {
  .vd-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
}
.vid {
  width: 100%;
  max-height: 360px;
  background: #000;
  border-radius: 8px;
}
.channels {
  margin-top: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.ch-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  font-size: 12px;
  border-bottom: 1px solid var(--border);
}
.ch-list {
  max-height: 180px;
  overflow: auto;
}
.ch-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  padding: 6px 10px;
  border: none;
  border-bottom: 1px solid var(--border);
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}
.ch-item:hover,
.ch-item.active {
  background: color-mix(in srgb, var(--accent, #818cf8) 12%, transparent);
}
.ch-title {
  font-size: 12px;
}
.ch-group {
  font-size: 10px;
  color: var(--text-muted);
}
.shot {
  margin-top: 10px;
}
.shot img {
  max-width: 100%;
  border-radius: 6px;
}
.shot-meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}
.info,
.log {
  margin: 0 0 10px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px;
  white-space: pre-wrap;
  max-height: 200px;
  overflow: auto;
}
.log {
  max-height: 260px;
}
.log-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sm {
  padding: 2px 8px;
  font-size: 0.75rem;
  min-height: 26px;
}
.log-line {
  margin-bottom: 2px;
}
.log-line.warn {
  color: #fbbf24;
}
.log-line.error {
  color: #f87171;
}
.log-line.system {
  color: var(--text-muted);
}
.t {
  color: #64748b;
  margin-right: 4px;
}
</style>
