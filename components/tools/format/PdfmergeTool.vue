<script setup lang="ts">
import { PDFDocument } from 'pdf-lib'

const mode = ref<'merge' | 'split'>('merge')
const { output, error, setOutput, setError, clearError } = useToolState()
const downloadUrl = ref('')
const downloadName = ref('merged.pdf')
const pageRange = ref('')
const files = ref<File[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const busy = ref(false)
const statusText = ref('')

function revoke() {
  if (downloadUrl.value) {
    URL.revokeObjectURL(downloadUrl.value)
    downloadUrl.value = ''
  }
}

/** 将 pdf-lib 等英文异常转为中文 */
function toFriendlyPdfError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e || '')
  if (!msg) return '处理失败'
  if (/[\u4e00-\u9fff]/.test(msg)) return msg
  if (/password|encrypted/i.test(msg)) return 'PDF 已加密，当前不支持解密后处理'
  if (/invalid|corrupt|failed to parse|Unexpected/i.test(msg)) {
    return 'PDF 无法读取：请确认文件完整且为合法 PDF'
  }
  return '处理失败：' + msg
}

/** 解析页码范围，如 1-3 / 2 / 1-（到末尾），1-based */
function parseRange(spec: string, pageCount: number): number[] {
  const s = String(spec || '').trim()
  if (!s) return Array.from({ length: pageCount }, (_, i) => i)
  const out: number[] = []
  for (const part of s.split(/[,，\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d+)\s*-\s*(\d*)$/)
    if (m) {
      const from = Math.max(1, parseInt(m[1]!, 10))
      const to = m[2] ? parseInt(m[2], 10) : pageCount
      for (let p = from; p <= Math.min(to, pageCount); p++) out.push(p - 1)
    } else {
      const n = parseInt(part, 10)
      if (!isNaN(n) && n >= 1 && n <= pageCount) out.push(n - 1)
    }
  }
  return [...new Set(out)].sort((a, b) => a - b)
}

function resetResult() {
  clearError()
  revoke()
  output.value = ''
  statusText.value = ''
}

function clearFiles() {
  files.value = []
  if (fileInput.value) fileInput.value.value = ''
  resetResult()
}

watch(mode, () => {
  clearFiles()
  pageRange.value = ''
})

function openPicker() {
  fileInput.value?.click()
}

function onPick(e: Event) {
  clearError()
  const list = Array.from((e.target as HTMLInputElement).files || [])
  if (!list.length) return
  if (mode.value === 'split') {
    files.value = list.slice(0, 1)
  } else {
    const merged = [...files.value]
    for (const f of list) {
      if (!merged.some((x) => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified)) {
        merged.push(f)
      }
    }
    files.value = merged
  }
  revoke()
  output.value = ''
  statusText.value =
    mode.value === 'merge'
      ? `已选择 ${files.value.length} 个 PDF，点击「合并」`
      : `已选择：${files.value[0]?.name || ''}，设置页码后点击「拆分」`
  if (fileInput.value) fileInput.value.value = ''
}

function removeAt(i: number) {
  files.value = files.value.filter((_, idx) => idx !== i)
  revoke()
  output.value = ''
  statusText.value = files.value.length
    ? mode.value === 'merge'
      ? `已选择 ${files.value.length} 个 PDF，点击「合并」`
      : `已选择：${files.value[0]?.name || ''}`
    : ''
}

async function run() {
  clearError()
  revoke()
  if (!files.value.length) {
    setError(mode.value === 'merge' ? '请先选择要合并的 PDF' : '请先选择要拆分的 PDF')
    return
  }
  if (mode.value === 'merge' && files.value.length < 2) {
    setError('合并至少需要 2 个 PDF 文件')
    return
  }
  busy.value = true
  statusText.value = mode.value === 'merge' ? '正在合并…' : '正在拆分…'
  try {
    if (mode.value === 'merge') {
      const merged = await PDFDocument.create()
      for (const f of files.value) {
        const src = await PDFDocument.load(await f.arrayBuffer())
        const pages = await merged.copyPages(src, src.getPageIndices())
        pages.forEach((p) => merged.addPage(p))
      }
      const out = await merged.save()
      const blob = new Blob([out], { type: 'application/pdf' })
      downloadUrl.value = URL.createObjectURL(blob)
      downloadName.value = 'merged.pdf'
      const msg = '合并完成，总页数 ' + merged.getPageCount() + '，可点击「下载」'
      setOutput(msg)
      statusText.value = msg
    } else {
      const f = files.value[0]!
      const src = await PDFDocument.load(await f.arrayBuffer())
      const indices = parseRange(pageRange.value, src.getPageCount())
      if (!indices.length) throw new Error('页码范围无效，请输入如 1-3 或 2,5')
      const dest = await PDFDocument.create()
      const pages = await dest.copyPages(src, indices)
      pages.forEach((p) => dest.addPage(p))
      const out = await dest.save()
      const blob = new Blob([out], { type: 'application/pdf' })
      downloadUrl.value = URL.createObjectURL(blob)
      downloadName.value = 'split.pdf'
      const msg = `拆分完成：源 ${src.getPageCount()} 页 → 取出 ${dest.getPageCount()} 页，可点击「下载」`
      setOutput(msg)
      statusText.value = msg
    }
  } catch (err) {
    setError(toFriendlyPdfError(err))
    statusText.value = ''
  } finally {
    busy.value = false
  }
}

onBeforeUnmount(() => {
  revoke()
})
</script>

<template>
  <UiToolShell title="PDF 合并 / 拆分" :error="error">
    <template #actions>
      <button type="button" class="btn" :disabled="busy" @click="run">
        {{ mode === 'merge' ? '合并' : '拆分' }}
      </button>
      <a v-if="downloadUrl" class="btn btn-ghost" :href="downloadUrl" :download="downloadName">下载</a>
      <button type="button" class="btn btn-ghost" @click="clearFiles">清空</button>
    </template>
    <template #toolbar>
      <div class="opts">
        <label><input v-model="mode" type="radio" value="merge" /> 合并</label>
        <label><input v-model="mode" type="radio" value="split" /> 按页拆分</label>
        <label v-if="mode === 'split'">页码
          <input
            v-model="pageRange"
            class="inp"
            style="width:120px"
            placeholder="例如 1-3"
          />
        </label>
      </div>
      <p class="hint">
        {{
          mode === 'merge'
            ? '选择多个 PDF 按顺序合并（本地处理，不上传）'
            : '选择单个 PDF，按页码范围导出；留空表示全部页'
        }}
      </p>
    </template>
    <template #input>
      <label class="lbl">{{ mode === 'merge' ? 'PDF 文件（多个）' : 'PDF 文件' }}</label>
      <div class="file-row">
        <button type="button" class="btn" @click="openPicker">选择 PDF</button>
        <span class="file-name">
          {{ files.length ? `已选 ${files.length} 个` : '未选择文件' }}
        </span>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="application/pdf,.pdf"
        class="hidden"
        :multiple="mode === 'merge'"
        @change="onPick"
      />
      <ul v-if="files.length" class="file-list">
        <li v-for="(f, i) in files" :key="f.name + f.size + i" class="file-item">
          <span class="file-item-name">{{ f.name }}</span>
          <button type="button" class="btn btn-ghost sm" @click="removeAt(i)">移除</button>
        </li>
      </ul>
      <p v-else class="empty-hint">
        {{
          mode === 'merge'
            ? '请选择至少 2 个 PDF，再点击「合并」'
            : '请选择一个 PDF，填写页码范围后点击「拆分」'
        }}
      </p>
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
