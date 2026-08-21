<script setup lang="ts">
import type { Map as LMap, Marker, Circle, TileLayer, LatLngExpression } from 'leaflet'
import {
  DEFAULT_CENTER,
  DEFAULT_TILE,
  DEFAULT_ZOOM,
  GEO_GOOD_ACC_M,
  GEO_SAMPLE_MS,
  mpClampLat,
  mpClampLng,
  mpFormatAccuracy,
  mpFormatJson,
  mpFormatLatLng,
  mpGeoErrorMessage,
  mpIsValidLatLng,
  mpNormalizeTileTemplate,
  mpParseCoordInput,
  mpZoomForAccuracy,
} from '#shared/debug/mappicker'

const { error, setError, clearError } = useToolState()
const { copy } = useClipboard()

const mapEl = ref<HTMLElement | null>(null)
const coordInput = ref('')
const tileUrl = ref(DEFAULT_TILE)
const decimals = ref(6)
const latText = ref('')
const lngText = ref('')
const zoomText = ref('—')
const centerText = ref('—')
const accuracyText = ref('—')
const statusText = ref('地图选址就绪 · 点击地图落点')

type LeafletNS = typeof import('leaflet')
let L: LeafletNS | null = null
let map: LMap | null = null
let marker: Marker | null = null
let tileLayer: TileLayer | null = null
let accuracyCircle: Circle | null = null
let mpLat: number | null = null
let mpLng: number | null = null
let mpAccuracy: number | null = null
let geoWatchId: number | null = null
let geoTimer: ReturnType<typeof setTimeout> | null = null
let geoBest: GeolocationPosition | null = null
let resizeHandler: (() => void) | null = null

function syncPanel() {
  const d = decimals.value
  latText.value = mpLat != null && isFinite(mpLat) ? Number(mpLat).toFixed(d) : ''
  lngText.value = mpLng != null && isFinite(mpLng) ? Number(mpLng).toFixed(d) : ''
  accuracyText.value = mpFormatAccuracy(mpAccuracy)
  if (map) {
    const z = map.getZoom()
    const c = map.getCenter()
    zoomText.value = String(z)
    centerText.value = Number(c.lat).toFixed(d) + ', ' + Number(c.lng).toFixed(d)
  } else {
    zoomText.value = '—'
    centerText.value = '—'
  }
}

function markerIcon() {
  if (!L) return undefined
  return L.divIcon({
    className: 'mp-marker-icon',
    html: '<span class="mp-pin" aria-hidden="true"></span>',
    iconSize: [28, 40],
    iconAnchor: [14, 38],
    popupAnchor: [0, -34],
  })
}

function setAccuracyCircle(lat: number | null, lng: number | null, accuracy: number) {
  if (!map || !L) return
  const r = typeof accuracy === 'number' && isFinite(accuracy) && accuracy > 0 ? accuracy : 0
  if (r <= 0 || lat == null || lng == null) {
    if (accuracyCircle) {
      map.removeLayer(accuracyCircle)
      accuracyCircle = null
    }
    return
  }
  const ll = L.latLng(lat, lng)
  if (accuracyCircle) {
    accuracyCircle.setLatLng(ll)
    accuracyCircle.setRadius(r)
  } else {
    accuracyCircle = L.circle(ll, {
      radius: r,
      color: '#3b82f6',
      weight: 1,
      fillColor: '#3b82f6',
      fillOpacity: 0.12,
      interactive: false,
    }).addTo(map)
  }
}

function setPoint(lat: number, lng: number, pan = true) {
  if (!mpIsValidLatLng(lat, lng)) return
  mpLat = mpClampLat(lat)
  mpLng = mpClampLng(lng)
  if (map && L) {
    const ll = L.latLng(mpLat, mpLng)
    if (marker) {
      marker.setLatLng(ll)
    } else {
      marker = L.marker(ll, {
        draggable: true,
        icon: markerIcon(),
        keyboard: true,
        title: '拖动调整位置',
      }).addTo(map)
      marker.on('dragend', () => {
        if (!marker) return
        const p = marker.getLatLng()
        mpLat = p.lat
        mpLng = p.lng
        syncPanel()
        statusText.value = '标记已移动'
      })
    }
    if (pan !== false) {
      const z = Math.max(map.getZoom(), 12)
      map.setView(ll, z)
    }
  }
  syncPanel()
}

function stopGeoWatch() {
  if (geoWatchId != null && typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      navigator.geolocation.clearWatch(geoWatchId)
    } catch {
      /* ignore */
    }
  }
  geoWatchId = null
  if (geoTimer) {
    clearTimeout(geoTimer)
    geoTimer = null
  }
}

function applyGeoPosition(
  pos: GeolocationPosition,
  opts: { pan?: boolean; fitAccuracy?: boolean } = {},
): boolean {
  if (!pos?.coords) return false
  const lat = pos.coords.latitude
  const lng = pos.coords.longitude
  if (!mpIsValidLatLng(lat, lng)) return false
  const acc =
    typeof pos.coords.accuracy === 'number' && isFinite(pos.coords.accuracy)
      ? pos.coords.accuracy
      : null
  mpAccuracy = acc
  setPoint(lat, lng, opts.fitAccuracy ? false : opts.pan !== false)
  setAccuracyCircle(lat, lng, acc ?? 0)
  if (map && L && opts.fitAccuracy && acc != null && acc > 0) {
    try {
      const circle = L.circle([lat, lng] as LatLngExpression, { radius: Math.max(acc, 15) })
      map.fitBounds(circle.getBounds().pad(0.35), {
        maxZoom: mpZoomForAccuracy(acc),
        animate: true,
      })
    } catch {
      map.setView([lat, lng], mpZoomForAccuracy(acc))
    }
  }
  coordInput.value = mpFormatLatLng(lat, lng, decimals.value, 'latlng')
  syncPanel()
  return true
}

function finishGeoLocate(hadError: boolean) {
  stopGeoWatch()
  if (!geoBest) {
    if (!hadError) {
      setError('未能获取有效位置')
      statusText.value = '定位无有效结果'
    }
    return
  }
  applyGeoPosition(geoBest, { pan: true, fitAccuracy: true })
  const acc = geoBest.coords.accuracy
  const accText = mpFormatAccuracy(acc)
  clearError()
  statusText.value =
    '当前位置 ' +
    mpFormatLatLng(geoBest.coords.latitude, geoBest.coords.longitude, decimals.value, 'latlng') +
    ' ' +
    accText
  geoBest = null
}

function locateCurrentPosition() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    setError('当前环境不支持定位')
    statusText.value = '不支持 Geolocation'
    return
  }
  stopGeoWatch()
  geoBest = null
  clearError()
  statusText.value = '精定位中…（约 ' + GEO_SAMPLE_MS / 1000 + 's，取最优精度）'

  const geoOpts: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 0,
  }
  let settledError: GeolocationPositionError | null = null

  function onSample(pos: GeolocationPosition) {
    if (!pos?.coords || !mpIsValidLatLng(pos.coords.latitude, pos.coords.longitude)) return
    const acc =
      typeof pos.coords.accuracy === 'number' && isFinite(pos.coords.accuracy)
        ? pos.coords.accuracy
        : Infinity
    const bestAcc =
      geoBest && typeof geoBest.coords.accuracy === 'number' ? geoBest.coords.accuracy : Infinity
    if (!geoBest || acc < bestAcc) {
      geoBest = pos
      applyGeoPosition(pos, { pan: true, fitAccuracy: false })
      statusText.value = '精定位采样中… 当前最佳 ' + mpFormatAccuracy(acc)
    }
    if (acc <= GEO_GOOD_ACC_M) {
      finishGeoLocate(false)
    }
  }

  function onError(err: GeolocationPositionError) {
    if (geoBest) return
    settledError = err
  }

  navigator.geolocation.getCurrentPosition(onSample, onError, geoOpts)
  geoWatchId = navigator.geolocation.watchPosition(onSample, onError, geoOpts)
  geoTimer = setTimeout(() => {
    if (geoBest) {
      finishGeoLocate(false)
    } else {
      stopGeoWatch()
      const msg = mpGeoErrorMessage(settledError) || '定位超时'
      setError(msg)
      statusText.value = msg
    }
  }, GEO_SAMPLE_MS)
}

function onMapClick(e: { latlng?: { lat: number; lng: number } }) {
  if (!e?.latlng) return
  stopGeoWatch()
  geoBest = null
  mpAccuracy = null
  setAccuracyCircle(null, null, 0)
  setPoint(e.latlng.lat, e.latlng.lng, false)
  clearError()
  statusText.value = '已选点'
}

function locateInput() {
  const text = String(coordInput.value || '').trim()
  if (!text) {
    locateCurrentPosition()
    return
  }
  const r = mpParseCoordInput(text)
  if (!r.ok) {
    setError(r.error || '坐标无效')
    statusText.value = r.error || '坐标无效'
    return
  }
  stopGeoWatch()
  geoBest = null
  mpAccuracy = null
  setAccuracyCircle(null, null, 0)
  setPoint(r.lat, r.lng, true)
  clearError()
  statusText.value = '已定位到 ' + mpFormatLatLng(r.lat, r.lng, decimals.value, 'latlng')
}

function clearPoint() {
  stopGeoWatch()
  geoBest = null
  mpLat = null
  mpLng = null
  mpAccuracy = null
  if (marker && map) map.removeLayer(marker)
  marker = null
  if (accuracyCircle && map) map.removeLayer(accuracyCircle)
  accuracyCircle = null
  coordInput.value = ''
  syncPanel()
  clearError()
  statusText.value = '已清空标记'
}

function resetView() {
  if (map) map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
  syncPanel()
  clearError()
  statusText.value = '已重置视图'
}

async function copyCoord(mode: 'latlng' | 'lnglat' | 'json') {
  if (mpLat == null || mpLng == null || !mpIsValidLatLng(mpLat, mpLng)) {
    setError('请先在地图上选点或定位')
    return
  }
  const d = decimals.value
  let text: string
  if (mode === 'lnglat') text = mpFormatLatLng(mpLat, mpLng, d, 'lnglat')
  else if (mode === 'json') text = mpFormatJson(mpLat, mpLng, d)
  else text = mpFormatLatLng(mpLat, mpLng, d, 'latlng')
  clearError()
  const ok = await copy(text)
  statusText.value = ok ? '已复制' : '复制失败'
}

function applyTileUrl() {
  if (!map || !L) {
    setError('地图未初始化')
    return
  }
  const url = String(tileUrl.value || '').trim()
  const norm = mpNormalizeTileTemplate(url)
  if (!norm.ok) {
    setError(norm.error)
    return
  }
  if (tileLayer) map.removeLayer(tileLayer)
  tileLayer = L.tileLayer(norm.url, norm.options).addTo(map)
  clearError()
  statusText.value = '已切换瓦片底图'
}

function onResize() {
  if (!map) return
  setTimeout(() => {
    map?.invalidateSize()
  }, 100)
}

async function initMap() {
  if (!mapEl.value || map) return
  const leafletMod = await import('leaflet')
  L = ((leafletMod as { default?: LeafletNS }).default ?? leafletMod) as LeafletNS
  await import('leaflet/dist/leaflet.css')

  map = L.map(mapEl.value, {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    zoomControl: true,
  })

  const url = tileUrl.value.trim() || DEFAULT_TILE
  if (!tileUrl.value.trim()) tileUrl.value = DEFAULT_TILE
  let norm = mpNormalizeTileTemplate(url)
  if (!norm.ok) norm = mpNormalizeTileTemplate(DEFAULT_TILE)
  if (norm.ok) {
    tileLayer = L.tileLayer(norm.url, norm.options).addTo(map)
  }

  map.on('click', onMapClick)
  map.on('moveend zoomend', () => syncPanel())

  setTimeout(() => {
    map?.invalidateSize()
    syncPanel()
  }, 80)
  setTimeout(() => map?.invalidateSize(), 300)

  resizeHandler = onResize
  window.addEventListener('resize', resizeHandler)
  statusText.value = '地图选址就绪 · 点击地图落点'
}

onMounted(() => {
  nextTick(() => {
    initMap().catch((e) => {
      setError(e instanceof Error ? e.message : '地图初始化失败')
    })
  })
})

onBeforeUnmount(() => {
  stopGeoWatch()
  geoBest = null
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
  if (map) {
    map.off()
    map.remove()
    map = null
  }
  marker = null
  tileLayer = null
  accuracyCircle = null
  L = null
})
</script>

<template>
  <ClientOnly>
    <UiToolShell title="地图选点" :error="error" :dual="false">
      <template #actions>
        <span class="status">{{ statusText }}</span>
      </template>

      <template #toolbar>
        <div class="mp-topbar">
          <input
            v-model="coordInput"
            class="inp"
            type="text"
            placeholder="纬度,经度；留空则定位当前位置"
            autocomplete="off"
            @keydown.enter.prevent="locateInput"
          />
          <button
            type="button"
            class="btn"
            title="有坐标则跳转；留空则精定位（多采样约 8 秒）"
            @click="locateInput"
          >
            定位
          </button>
          <button type="button" class="btn btn-ghost" @click="clearPoint">清空</button>
          <button type="button" class="btn btn-ghost" @click="resetView">重置视图</button>
        </div>
        <p class="hint">
          坐标系为 WGS84（EPSG:4326）。国内地图 App 常用 GCJ-02，直接套用可能有偏移。默认瓦片来自
          OpenStreetMap，请遵守其使用政策；可改为自建 / 镜像模板。
        </p>
      </template>

      <div class="mp-layout">
        <div class="mp-map-wrap">
          <div ref="mapEl" class="mp-map" role="application" aria-label="地图选址" />
        </div>

        <div class="mp-side">
          <section class="mp-card">
            <div class="mp-card-head">当前坐标</div>
            <div class="mp-field">
              <label class="lbl">纬度 lat</label>
              <input class="inp" type="text" readonly :value="latText" placeholder="—" />
            </div>
            <div class="mp-field">
              <label class="lbl">经度 lng</label>
              <input class="inp" type="text" readonly :value="lngText" placeholder="—" />
            </div>
            <div class="mp-field">
              <label class="lbl">小数位</label>
              <select v-model.number="decimals" class="sel" @change="syncPanel">
                <option :value="6">6</option>
                <option :value="7">7</option>
                <option :value="8">8</option>
              </select>
            </div>
            <div class="mp-copy-row">
              <button type="button" class="btn btn-ghost sm" @click="copyCoord('latlng')">
                lat,lng
              </button>
              <button type="button" class="btn btn-ghost sm" @click="copyCoord('lnglat')">
                lng,lat
              </button>
              <button type="button" class="btn btn-ghost sm" @click="copyCoord('json')">JSON</button>
            </div>
          </section>

          <section class="mp-card">
            <div class="mp-card-head">地图状态</div>
            <div class="mp-meta">
              <div class="mp-meta-row">
                <span class="mp-meta-k">缩放 z</span>
                <span class="mp-meta-v">{{ zoomText }}</span>
              </div>
              <div class="mp-meta-row">
                <span class="mp-meta-k">中心点</span>
                <span class="mp-meta-v">{{ centerText }}</span>
              </div>
              <div class="mp-meta-row">
                <span class="mp-meta-k">定位精度</span>
                <span class="mp-meta-v">{{ accuracyText }}</span>
              </div>
            </div>
          </section>

          <section class="mp-card">
            <div class="mp-card-head">瓦片底图</div>
            <div class="mp-field">
              <label class="lbl">Tile URL 模板</label>
              <input
                v-model="tileUrl"
                class="inp"
                type="text"
                placeholder="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </div>
            <button type="button" class="btn btn-ghost sm" @click="applyTileUrl">应用瓦片</button>
          </section>
        </div>
      </div>
    </UiToolShell>
    <template #fallback>
      <p class="muted-fallback">地图选点需在浏览器端加载 Leaflet…</p>
    </template>
  </ClientOnly>
</template>

<style scoped>
:deep(.tool-shell__single) {
  overflow: auto;
}
.mp-topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.mp-topbar .inp {
  flex: 1;
  min-width: 200px;
}
.status {
  font-size: 0.82rem;
  color: var(--text-muted);
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mp-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 12px;
  align-items: stretch;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}
@media (max-width: 1100px) {
  .mp-layout {
    grid-template-columns: 1fr;
    height: auto;
    align-items: start;
  }
  .mp-side {
    max-width: none;
    max-height: none;
    overflow: visible;
  }
  .mp-map {
    height: min(56vh, 520px);
    min-height: 360px;
  }
}
.mp-map-wrap {
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.mp-map {
  width: 100%;
  flex: 1 1 auto;
  min-height: 360px;
  height: 100%;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-terminal, #0b1220);
  z-index: 0;
  overflow: hidden;
}
.mp-side {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  max-width: 280px;
  max-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 2px;
}
.mp-card {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: rgba(15, 23, 42, 0.35);
  min-width: 0;
}
.mp-card-head {
  font-size: 0.88rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--text-strong, var(--text));
}
.mp-field {
  margin-bottom: 10px;
}
.mp-field:last-child {
  margin-bottom: 0;
}
.mp-field .inp,
.mp-field .sel {
  width: 100%;
}
.mp-copy-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}
.mp-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mp-meta-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}
.mp-meta-k {
  color: var(--text-muted);
  flex-shrink: 0;
}
.mp-meta-v {
  font-family: var(--mono);
  text-align: right;
  word-break: break-all;
}
.muted-fallback {
  font-size: 0.86rem;
  color: var(--text-muted);
}
:deep(.mp-marker-icon) {
  background: transparent !important;
  border: none !important;
}
:deep(.mp-pin) {
  display: block;
  width: 28px;
  height: 40px;
  position: relative;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35));
}
:deep(.mp-pin::before) {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  width: 22px;
  height: 22px;
  margin-left: -11px;
  border-radius: 50% 50% 50% 0;
  background: #e74c3c;
  border: 2px solid #fff;
  transform: rotate(-45deg);
  box-sizing: border-box;
}
:deep(.mp-pin::after) {
  content: '';
  position: absolute;
  left: 50%;
  top: 7px;
  width: 8px;
  height: 8px;
  margin-left: -4px;
  border-radius: 50%;
  background: #fff;
}
.sm {
  padding: 4px 10px;
  font-size: 0.8rem;
}
</style>
