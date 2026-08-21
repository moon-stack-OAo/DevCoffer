<script setup lang="ts">
const MAX_SIZE = 8 * 1024 * 1024

type FileItem = {
  id: string
  name: string
  size: number
  type: string
  dataUrl: string
}

const { error, setError, clearError } = useToolState()

const tab = ref<'encode' | 'decode'>('encode')
const files = ref<FileItem[]>([])
const activeId = ref('')
const output = ref('')
const decodeInput = ref('')
const preview = ref('')
const previewMeta = ref('')
const dragging = ref(false)

const activeFile = computed(() => files.value.find((f) => f.id === activeId.value) || null)

watch(activeFile, (f) => {
  output.value = f?.dataUrl || ''
})

function formatSize(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('读取失败'))
    reader.readAsDataURL(file)
  })
}

async function addFiles(list: FileList | File[] | null) {
  if (!list || !list.length) return
  clearError()
  const arr = Array.from(list)
  for (const file of arr) {
    if (file.size > MAX_SIZE) {
      setError(`「${file.name}」过大（限制 8MB）`)
      continue
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const item: FileItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl,
      }
      files.value.push(item)
      activeId.value = item.id
      output.value = item.dataUrl
    } catch {
      setError(`读取「${file.name}」失败`)
    }
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  void addFiles(input.files)
  input.value = ''
}

function onDrop(e: DragEvent) {
  dragging.value = false
  void addFiles(e.dataTransfer?.files || null)
}

function selectFile(id: string) {
  activeId.value = id
  const f = files.value.find((x) => x.id === id)
  output.value = f?.dataUrl || ''
  clearError()
}

/** 校验纯 Base64：字符集 + padding，并用 atob 确认 */
function assertValidBase64(b64: string) {
  const clean = b64.replace(/\s+/g, '')
  if (!clean) throw new Error('Base64 为空')
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean) || clean.length % 4 === 1) {
    throw new Error('非法 Base64')
  }
  try {
    atob(clean)
  } catch {
    throw new Error('非法 Base64')
  }
  return clean
}

function approxBytesFromB64(b64: string) {
  const clean = b64.replace(/\s+/g, '')
  const pad = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((clean.length * 3) / 4) - pad)
}

function loadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('无效图片：无法解码为图像'))
    img.src = src
  })
}

async function previewFromText() {
  clearError()
  preview.value = ''
  previewMeta.value = ''
  const raw = decodeInput.value.trim()
  if (!raw) {
    setError('请粘贴 DataURL 或纯 Base64')
    return
  }

  try {
    let mime = 'image/png'
    let b64 = ''
    let src = ''

    if (/^data:/i.test(raw)) {
      const m = raw.match(/^data:([^;,]+);base64,([\s\S]+)$/i)
      if (!m) throw new Error('无效 DataURL：需形如 data:<mime>;base64,<数据>')
      mime = m[1]!.trim() || 'application/octet-stream'
      b64 = assertValidBase64(m[2]!)
      src = `data:${mime};base64,${b64}`
    } else {
      b64 = assertValidBase64(raw)
      src = `data:image/png;base64,${b64}`
      mime = 'image/png'
    }

    await loadImage(src)
    preview.value = src
    const bytes = approxBytesFromB64(b64)
    previewMeta.value = `MIME: ${mime} · 约 ${formatSize(bytes)} · Base64 ${b64.length} 字符`
  } catch (e) {
    preview.value = ''
    previewMeta.value = ''
    setError(e instanceof Error ? e.message : '预览失败')
  }
}

function clearAll() {
  files.value = []
  activeId.value = ''
  output.value = ''
  decodeInput.value = ''
  preview.value = ''
  previewMeta.value = ''
  clearError()
}
</script>

<template>
  <UiToolShell title="图片 ↔ Base64" :error="error" :dual="false">
    <template #actions>
      <button v-if="tab === 'decode'" type="button" class="btn" @click="previewFromText">预览</button>
      <UiCopyButton v-if="tab === 'encode'" :text="output" />
      <UiCopyButton v-else :text="preview" label="复制 DataURL" />
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
    </template>
    <template #toolbar>
      <p class="hint">文件 → DataURL；或粘贴 DataURL / 纯 Base64 → 预览。单文件限制 8MB。</p>
    </template>

    <div class="ib64-tabs tabs">
      <button type="button" class="tab" :class="{ active: tab === 'encode' }" @click="tab = 'encode'">
        图片 → Base64
      </button>
      <button type="button" class="tab" :class="{ active: tab === 'decode' }" @click="tab = 'decode'">
        Base64 → 图片
      </button>
    </div>

    <!-- Tab1：图片 → Base64 -->
    <div v-show="tab === 'encode'" class="ib64-main">
      <div class="ib64-col ib64-col-in">
        <div class="ib64-card">
          <div class="ib64-card-title"><i class="bi bi-upload" /> 选择 / 拖入文件</div>
          <input type="file" class="inp ib64-file" multiple accept="*/*" @change="onFileChange" />
          <div
            class="img2b64-drop"
            :class="{ dragover: dragging }"
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="onDrop"
          >
            拖拽文件到此处（可多选；非图片也可生成 DataURL）
          </div>
        </div>
        <div class="ib64-card ib64-card-list">
          <div class="ib64-card-title"><i class="bi bi-files" /> 文件列表</div>
          <div class="img2b64-list">
            <div
              v-for="f in files"
              :key="f.id"
              class="img2b64-item"
              :class="{ active: f.id === activeId }"
              @click="selectFile(f.id)"
            >
              <img
                v-if="f.type.startsWith('image/') && f.dataUrl"
                class="img2b64-thumb"
                :src="f.dataUrl"
                alt=""
              />
              <div v-else class="img2b64-thumb" />
              <div class="img2b64-info">
                <div class="img2b64-name">{{ f.name }}</div>
                <div class="img2b64-meta">{{ f.type || 'unknown' }} · {{ formatSize(f.size) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="ib64-col ib64-col-out">
        <div class="ib64-card ib64-output-wrap">
          <div class="ib64-toolbar">
            <div class="ib64-card-title"><i class="bi bi-filetype-txt" /> DataURL 输出</div>
          </div>
          <textarea
            class="ta ib64-output"
            :value="output"
            readonly
            placeholder="选中左侧文件后显示 DataURL…"
          />
        </div>
      </div>
    </div>

    <!-- Tab2：Base64 → 图片 -->
    <div v-show="tab === 'decode'" class="ib64-main">
      <div class="ib64-col ib64-col-in">
        <div class="ib64-card ib64-card-decode">
          <div class="ib64-card-title"><i class="bi bi-clipboard" /> 粘贴 DataURL / Base64</div>
          <textarea
            v-model="decodeInput"
            class="ta ib64-decode-input"
            placeholder="data:image/png;base64,... 或纯 Base64"
          />
        </div>
      </div>
      <div class="ib64-col ib64-col-out">
        <div class="ib64-card ib64-card-preview">
          <div class="ib64-card-title"><i class="bi bi-image" /> 预览</div>
          <div class="b642img-preview">
            <img v-if="preview" :src="preview" alt="preview" />
            <div v-else class="placeholder">点击「预览」查看图片</div>
          </div>
          <div class="b642img-meta">{{ previewMeta }}</div>
        </div>
      </div>
    </div>
  </UiToolShell>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 12px;
}
.tab {
  padding: 8px 14px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 13px;
  margin-bottom: -1px;
}
.tab.active {
  color: var(--accent, #818cf8);
  border-bottom-color: var(--accent, #818cf8);
  font-weight: 600;
}
</style>
