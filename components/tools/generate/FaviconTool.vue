<script setup lang="ts">
import { faviconSvg } from '#shared/generate/favicon'
const text = ref('TP'), bg = ref('#0369a1'), fg = ref('#e0f2fe'), size = ref(64)
const { output, error, setOutput, clearError } = useToolState()
const dataUrl = computed(() => 'data:image/svg+xml;utf8,' + encodeURIComponent(output.value || ''))
const pngUrls = ref<Record<number, string>>({})
function run() {
  clearError()
  setOutput(faviconSvg(text.value, bg.value, fg.value, size.value))
  pngUrls.value = {}
  nextTick(() => buildPngs())
}
async function buildPngs() {
  if (!import.meta.client || !output.value) return
  const sizes = [32, 48]
  const next: Record<number, string> = {}
  for (const s of sizes) {
    const svg = faviconSvg(text.value, bg.value, fg.value, s)
    const url = await svgToPng(svg, s)
    if (url) next[s] = url
  }
  pngUrls.value = next
}
function svgToPng(svg: string, s: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const obj = URL.createObjectURL(blob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = s
      canvas.height = s
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(obj); resolve(null); return }
      ctx.drawImage(img, 0, 0, s, s)
      URL.revokeObjectURL(obj)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => { URL.revokeObjectURL(obj); resolve(null) }
    img.src = obj
  })
}
run()
</script>
<template>
  <UiToolShell title="Favicon 生成" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
      <a v-if="output" class="btn btn-ghost" :href="dataUrl" download="favicon.svg">下载 SVG</a>
      <a v-if="pngUrls[32]" class="btn btn-ghost" :href="pngUrls[32]" download="favicon-32.png">PNG 32</a>
      <a v-if="pngUrls[48]" class="btn btn-ghost" :href="pngUrls[48]" download="favicon-48.png">PNG 48</a>
    </template>
    <template #toolbar>
      <div class="opts">
        <label>文字（限 2 字） <input v-model="text" class="inp" maxlength="2" style="width:60px;min-width:60px" @change="run" /></label>
        <label>背景 <input v-model="bg" type="color" @input="run" /></label>
        <label>前景 <input v-model="fg" type="color" @input="run" /></label>
        <label>尺寸 <input v-model.number="size" type="number" class="num" @change="run" /></label>
      </div>
      <p class="hint">文字最多 2 个字符；可下载 SVG 或常见尺寸 PNG（32 / 48）。</p>
    </template>
    <template #input>
      <label class="lbl">预览</label>
      <div class="preview fav-preview">
        <img v-if="output" :src="dataUrl" alt="Favicon 预览" class="favimg" />
      </div>
    </template>
    <template #output>
      <label class="lbl">SVG</label>
      <textarea :value="output" class="ta" rows="10" readonly />
    </template>
  </UiToolShell>
</template>
<style scoped>
.hint {
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}
.preview.fav-preview {
  flex: 0 0 auto;
  min-height: 0;
  padding: 16px;
  align-items: center;
  justify-content: center;
}
.favimg {
  width: 128px;
  height: 128px;
  image-rendering: auto;
  border-radius: var(--radius-sm);
  background: #fff;
  padding: 8px;
  display: block;
  box-shadow: 0 0 0 1px var(--border);
}
</style>
