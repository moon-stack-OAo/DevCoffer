<script setup lang="ts">
const quality = ref(0.7)
const maxW = ref(1920)
const format = ref<'image/jpeg' | 'image/webp'>('image/jpeg')
const preview = ref('')
const info = ref('')
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const sourceFile = ref<File | null>(null)
const sourceUrl = ref('')
const sourceImg = ref<HTMLImageElement | null>(null)
const { output, error, setOutput, setError, clearError } = useToolState()

const downloadName = computed(() => format.value === 'image/webp' ? 'compressed.webp' : 'compressed.jpg')

function revokeSource() {
  if (sourceUrl.value) {
    URL.revokeObjectURL(sourceUrl.value)
    sourceUrl.value = ''
  }
}

function runCompress(img: HTMLImageElement, file: File) {
  const q = Math.min(1, Math.max(0.1, Number(quality.value) || 0.7))
  const mw = Math.max(1, Number(maxW.value) || 1920)
  const scale = Math.min(1, mw / img.width)
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  const data = canvas.toDataURL(format.value, q)
  preview.value = data
  setOutput(data)
  const outKb = Math.round((data.length * 0.75) / 1024)
  const inKb = Math.round(file.size / 1024)
  const ratio = inKb > 0 ? Math.round((1 - outKb / inKb) * 100) : 0
  info.value = `原 ${inKb} KB → 约 ${outKb} KB（${ratio > 0 ? '减小 ' + ratio + '%' : '约同大小'}）· ${w}×${h}`
}

function loadFile(file: File) {
  clearError()
  if (!file.type.startsWith('image/')) {
    setError('请选择图片文件')
    return
  }
  revokeSource()
  sourceFile.value = file
  sourceImg.value = null
  const url = URL.createObjectURL(file)
  sourceUrl.value = url
  const img = new Image()
  img.onload = () => {
    sourceImg.value = img
    runCompress(img, file)
  }
  img.onerror = () => setError('读取失败')
  img.src = url
}

function recompress() {
  if (sourceImg.value && sourceFile.value) {
    clearError()
    runCompress(sourceImg.value, sourceFile.value)
  }
}

function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) loadFile(file)
}

function openPicker() {
  fileInput.value?.click()
}

function onDrop(ev: DragEvent) {
  ev.preventDefault()
  dragOver.value = false
  const file = ev.dataTransfer?.files?.[0]
  if (file) loadFile(file)
}

function onDragOver(ev: DragEvent) {
  ev.preventDefault()
  dragOver.value = true
}

function onDragLeave() {
  dragOver.value = false
}

watch([quality, maxW, format], () => {
  recompress()
})

onBeforeUnmount(() => {
  revokeSource()
})
</script>
<template>
  <UiToolShell title="图片压缩" :error="error">
    <template #actions>
      <UiCopyButton :text="output" />
      <a v-if="output" class="btn" :href="output" :download="downloadName">下载</a>
    </template>
    <template #toolbar>
      <p class="hint">本地压缩，图片不会上传。调整参数后自动重新压缩。</p>
      <div class="opts">
        <label>质量 <input v-model.number="quality" type="number" min="0.1" max="1" step="0.05" class="inp" style="width:70px" /></label>
        <label>最大宽 <input v-model.number="maxW" type="number" class="inp" style="width:90px" /></label>
        <label>格式
          <select v-model="format" class="sel">
            <option value="image/jpeg">JPEG</option>
            <option value="image/webp">WebP</option>
          </select>
        </label>
      </div>
    </template>
    <template #input>
      <label class="lbl">选择图片</label>
      <div
        class="ic-drop"
        :class="{ dragover: dragOver }"
        role="button"
        tabindex="0"
        @click="openPicker"
        @keydown.enter.prevent="openPicker"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <div class="ic-drop-inner">
          <div>{{ sourceFile ? '点击更换图片' : '点击或拖拽图片到此处' }}</div>
          <div class="ic-drop-tip">支持 JPG / PNG / WebP / GIF 等常见格式</div>
          <div v-if="sourceFile" class="ic-drop-tip">{{ sourceFile.name }}</div>
        </div>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.bmp"
        class="hidden"
        @change="onFile"
      />
      <p v-if="info" class="hint">{{ info }}</p>
      <div v-if="preview" class="ic-thumbs" style="margin-top:10px">
        <div class="ic-thumb">
          <img v-if="sourceUrl" :src="sourceUrl" alt="原图" />
          <span class="ic-thumb-label">原图</span>
        </div>
        <div class="ic-thumb">
          <img :src="preview" alt="压缩后" />
          <span class="ic-thumb-label">压缩后</span>
        </div>
      </div>
    </template>
    <template #output>
      <label class="lbl">Data URL</label>
      <textarea :value="output" class="ta" rows="8" readonly />
    </template>
  </UiToolShell>
</template>
<style scoped>
.hidden { display: none; }
</style>
