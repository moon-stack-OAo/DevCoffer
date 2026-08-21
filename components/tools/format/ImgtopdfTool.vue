<script setup lang="ts">
import { PDFDocument } from 'pdf-lib'

const { output, error, setOutput, setError, clearError } = useToolState()
const downloadUrl = ref('')
const files = ref<File[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const busy = ref(false)
const statusText = ref('')

function revokeDownload() {
  if (downloadUrl.value) {
    URL.revokeObjectURL(downloadUrl.value)
    downloadUrl.value = ''
  }
}

function openPicker() {
  fileInput.value?.click()
}

function onPick(e: Event) {
  clearError()
  const list = Array.from((e.target as HTMLInputElement).files || [])
  if (!list.length) return
  // 追加选择，去重同名同大小
  const merged = [...files.value]
  for (const f of list) {
    if (!merged.some((x) => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified)) {
      merged.push(f)
    }
  }
  files.value = merged
  revokeDownload()
  output.value = ''
  statusText.value = `已选择 ${files.value.length} 张图片，点击「生成 PDF」`
  if (fileInput.value) fileInput.value.value = ''
}

function removeAt(i: number) {
  files.value = files.value.filter((_, idx) => idx !== i)
  revokeDownload()
  output.value = ''
  statusText.value = files.value.length
    ? `已选择 ${files.value.length} 张图片，点击「生成 PDF」`
    : ''
}

function clearAll() {
  files.value = []
  if (fileInput.value) fileInput.value.value = ''
  revokeDownload()
  clearError()
  output.value = ''
  statusText.value = ''
}

async function generate() {
  clearError()
  revokeDownload()
  if (!files.value.length) {
    setError('请先选择图片（PNG / JPG）')
    return
  }
  busy.value = true
  statusText.value = '正在生成 PDF…'
  try {
    const pdf = await PDFDocument.create()
    for (const f of files.value) {
      const buf = await f.arrayBuffer()
      const bytes = new Uint8Array(buf)
      let img
      if (/png$/i.test(f.type) || /\.png$/i.test(f.name)) img = await pdf.embedPng(bytes)
      else if (/jpe?g$/i.test(f.type) || /\.jpe?g$/i.test(f.name)) img = await pdf.embedJpg(bytes)
      else throw new Error(`不支持的图片格式：${f.name}（仅 PNG / JPG）`)
      const page = pdf.addPage([img.width, img.height])
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
    }
    const out = await pdf.save()
    const blob = new Blob([out], { type: 'application/pdf' })
    downloadUrl.value = URL.createObjectURL(blob)
    const msg = `已生成 PDF，共 ${pdf.getPageCount()} 页，可点击「下载 PDF」`
    setOutput(msg)
    statusText.value = msg
  } catch (err) {
    const msg = err instanceof Error ? err.message : '生成失败'
    if (/[\u4e00-\u9fff]/.test(msg)) setError(msg)
    else setError('生成 PDF 失败：' + msg)
    statusText.value = ''
  } finally {
    busy.value = false
  }
}

onBeforeUnmount(() => {
  revokeDownload()
})
</script>

<template>
  <UiToolShell title="图片转 PDF" :error="error">
    <template #actions>
      <button type="button" class="btn" :disabled="busy" @click="generate">生成 PDF</button>
      <a v-if="downloadUrl" class="btn btn-ghost" :href="downloadUrl" download="images.pdf">下载 PDF</a>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
    </template>
    <template #toolbar>
      <p class="hint">本地合成，图片不会上传。支持 PNG / JPG，可多选按顺序成页。</p>
    </template>
    <template #input>
      <label class="lbl">选择图片</label>
      <div class="file-row">
        <button type="button" class="btn" @click="openPicker">选择图片</button>
        <span class="file-name">{{ files.length ? `已选 ${files.length} 张` : '未选择图片' }}</span>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,.png,.jpg,.jpeg"
        multiple
        class="hidden"
        @change="onPick"
      />
      <ul v-if="files.length" class="file-list">
        <li v-for="(f, i) in files" :key="f.name + f.size + i" class="file-item">
          <span class="file-item-name">{{ f.name }}</span>
          <button type="button" class="btn btn-ghost sm" @click="removeAt(i)">移除</button>
        </li>
      </ul>
      <p v-else class="empty-hint">请点击「选择图片」添加 PNG / JPG，再点击「生成 PDF」</p>
    </template>
    <template #output>
      <label class="lbl">状态</label>
      <div class="status-box" role="status">
        {{ statusText || output || '等待操作…' }}
      </div>
    </template>
  </UiToolShell>
</template>

<style scoped>
.hidden {
  display: none;
}
.file-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.file-name {
  color: var(--text-muted);
  font-size: 0.86rem;
}
.file-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  max-height: 220px;
  overflow: auto;
}
.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  font-size: 0.86rem;
}
.file-item:last-child {
  border-bottom: none;
}
.file-item-name {
  word-break: break-all;
  min-width: 0;
}
.sm {
  padding: 2px 8px;
  font-size: 0.8rem;
}
.empty-hint {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 0.86rem;
}
.status-box {
  min-height: 72px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style>
