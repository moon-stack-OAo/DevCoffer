<script setup lang="ts">
const cols = ref(4)
const rows = ref(4)
const preview = ref('')
const sourceUrl = ref('')
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const sourceFile = ref<File | null>(null)
const sourceImg = ref<HTMLImageElement | null>(null)
const { output, error, setOutput, setError, clearError } = useToolState()

function revokeSource() {
  if (sourceUrl.value) {
    URL.revokeObjectURL(sourceUrl.value)
    sourceUrl.value = ''
  }
}

function shuffleFromImg(img: HTMLImageElement) {
  const c = Math.min(12, Math.max(2, Math.floor(Number(cols.value) || 4)))
  const r = Math.min(12, Math.max(2, Math.floor(Number(rows.value) || 4)))
  const tw = Math.floor(img.width / c)
  const th = Math.floor(img.height / r)
  if (tw < 1 || th < 1) {
    setError('行列过大，无法切块')
    return
  }
  const canvas = document.createElement('canvas')
  canvas.width = tw * c
  canvas.height = th * r
  const ctx = canvas.getContext('2d')!
  const tiles: { sx: number; sy: number }[] = []
  for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) tiles.push({ sx: x * tw, sy: y * th })
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j]!, tiles[i]!]
  }
  let k = 0
  for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) {
    const t = tiles[k++]!
    ctx.drawImage(img, t.sx, t.sy, tw, th, x * tw, y * th, tw, th)
  }
  const data = canvas.toDataURL('image/png')
  preview.value = data
  setOutput(data)
}

function loadFile(file: File) {
  clearError()
  if (!file.type.startsWith('image/')) {
    setError('请选择图片文件')
    return
  }
  revokeSource()
  sourceFile.value = file
  const url = URL.createObjectURL(file)
  sourceUrl.value = url
  const img = new Image()
  img.onload = () => {
    sourceImg.value = img
    shuffleFromImg(img)
  }
  img.onerror = () => setError('读取失败')
  img.src = url
}

function reshuffle() {
  if (sourceImg.value) {
    clearError()
    shuffleFromImg(sourceImg.value)
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

watch([cols, rows], () => {
  if (sourceImg.value) reshuffle()
})

onBeforeUnmount(() => {
  revokeSource()
})
</script>
<template>
  <UiToolShell title="图片混淆" :error="error">
    <template #actions>
      <button v-if="sourceImg" type="button" class="btn btn-ghost" @click="reshuffle">重新打乱</button>
      <a v-if="output" class="btn" :href="output" download="shuffle.png">下载</a>
    </template>
    <template #toolbar>
      <p class="ims-hint ims-hint-warn">⚠ 打乱后不可还原，请先备份原图。</p>
      <div class="opts">
        <label>列 <input v-model.number="cols" type="number" min="2" max="12" class="inp" style="width:60px" /></label>
        <label>行 <input v-model.number="rows" type="number" min="2" max="12" class="inp" style="width:60px" /></label>
      </div>
    </template>
    <template #input>
      <label class="lbl">选择图片</label>
      <div
        class="ims-drop"
        :class="{ dragover: dragOver }"
        role="button"
        tabindex="0"
        @click="openPicker"
        @keydown.enter.prevent="openPicker"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <div class="ims-drop-inner">
          <div>{{ sourceFile ? '点击更换图片' : '点击或拖拽图片到此处' }}</div>
          <div class="ims-drop-tip">随机切块打乱拼贴</div>
          <div v-if="sourceFile" class="ims-drop-tip">{{ sourceFile.name }}</div>
        </div>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.bmp"
        class="hidden"
        @change="onFile"
      />
      <div v-if="preview" class="ims-previews" style="margin-top:10px;flex:none">
        <div class="ims-preview-box">
          <div class="ims-preview-label">原图</div>
          <div class="ims-preview-frame">
            <img v-if="sourceUrl" :src="sourceUrl" alt="原图" />
          </div>
        </div>
        <div class="ims-preview-box">
          <div class="ims-preview-label">混淆后</div>
          <div class="ims-preview-frame">
            <img :src="preview" alt="混淆后" />
          </div>
        </div>
      </div>
    </template>
    <template #output>
      <label class="lbl">Data URL</label>
      <textarea :value="output" class="ta" rows="6" readonly />
    </template>
  </UiToolShell>
</template>
<style scoped>
.hidden { display: none; }
</style>
