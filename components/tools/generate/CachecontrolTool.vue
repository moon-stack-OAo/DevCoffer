<script setup lang="ts">
import { CACHE_CONTROL_PRESETS, cacheControlBuild } from '#shared/generate/cachecontrol'

const scope = ref<'public' | 'private'>('public')
const noStore = ref(false)
const noCache = ref(false)
const mustRevalidate = ref(false)
const immutable = ref(false)
const maxAge = ref('3600')
const sMaxAge = ref('')
const swr = ref('')
const sie = ref('')
const includeExpires = ref(false)
const vary = ref('Accept-Encoding')
const { output, error, setOutput, setError, clearError } = useToolState()

function applyPreset(id: string) {
    const p = CACHE_CONTROL_PRESETS.find((x) => x.id === id)
    if (!p) return
    const o = p.opts
    scope.value = o.scope
    noStore.value = o.noStore
    noCache.value = o.noCache
    mustRevalidate.value = o.mustRevalidate
    immutable.value = o.immutable
    maxAge.value = o.maxAge
    sMaxAge.value = o.sMaxAge
    swr.value = o.swr
    sie.value = o.sie ?? ''
    includeExpires.value = o.includeExpires
    vary.value = o.vary
    run()
}

function run() {
    clearError()
    const r = cacheControlBuild({
        scope: scope.value,
        noStore: noStore.value,
        noCache: noCache.value,
        mustRevalidate: mustRevalidate.value,
        immutable: immutable.value,
        maxAge: maxAge.value,
        sMaxAge: sMaxAge.value,
        swr: swr.value,
        sie: sie.value,
        includeExpires: includeExpires.value,
        vary: vary.value,
    })
    if (!r.ok) {
        setError(r.msg || '生成失败')
        return
    }
    setOutput([r.headersText, '', '摘要: ' + r.summary].join('\n'))
}

watch(
    [scope, noStore, noCache, mustRevalidate, immutable, maxAge, sMaxAge, swr, sie, includeExpires, vary],
    () => run(),
)
onMounted(() => run())
</script>

<template>
  <UiToolShell title="Cache-Control 生成" :error="error" :dual="false">
    <template #actions>
      <button
        v-for="p in CACHE_CONTROL_PRESETS"
        :key="p.id"
        type="button"
        class="btn btn-ghost"
        @click="applyPreset(p.id)"
      >
        {{ p.name }}
      </button>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <p class="hint">生成 Cache-Control / Expires / Vary；CDN 专有头需自行在边缘配置。</p>
    <div class="opts">
      <label>范围
        <select v-model="scope" class="sel"><option value="public">public</option><option value="private">private</option></select>
      </label>
      <label><input v-model="noStore" type="checkbox" /> no-store</label>
      <label><input v-model="noCache" type="checkbox" /> no-cache</label>
      <label><input v-model="mustRevalidate" type="checkbox" /> must-revalidate</label>
      <label><input v-model="immutable" type="checkbox" /> immutable</label>
      <label><input v-model="includeExpires" type="checkbox" /> Expires</label>
    </div>
    <div class="row">
      <label>max-age <input v-model="maxAge" class="num" /></label>
      <label>s-maxage <input v-model="sMaxAge" class="num" /></label>
      <label>过期后仍可用(SWR) <input v-model="swr" class="num" /></label>
      <label>出错时仍可用(SIE) <input v-model="sie" class="num" /></label>
      <label>Vary <input v-model="vary" class="inp" /></label>
    </div>
    <textarea :value="output" class="ta" rows="10" readonly />
  </UiToolShell>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 0.82rem;
  color: var(--text-muted);
  align-items: center;
}
.row label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.row .num { width: 88px; }
.row .inp { width: auto; min-width: 160px; padding: 6px 10px; }
</style>
