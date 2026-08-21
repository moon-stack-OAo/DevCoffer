<script setup lang="ts">
import QRCode from 'qrcode'
import jsQR from 'jsqr'

type Tab = 'encode' | 'decode'

const route = useRoute()
const initialTab: Tab = route.query.tab === 'decode' ? 'decode' : 'encode'
const tab = ref<Tab>(initialTab)

/** —— 生成 —— */
const text = ref('https://example.com')
const size = ref(256)
const margin = ref(1)
const dataUrl = ref('')
const copyTip = ref('')
const showDataUrl = ref(false)
const encodeError = ref('')
const encodeOutput = ref('')

let timer: ReturnType<typeof setTimeout> | null = null

async function runEncode() {
  encodeError.value = ''
  copyTip.value = ''
  const content = text.value.trim()
  if (!content) {
    dataUrl.value = ''
    encodeOutput.value = ''
    encodeError.value = '请输入文本或 URL'
    return
  }
  try {
    const w = Math.min(1024, Math.max(64, Number(size.value) || 256))
    size.value = w
    dataUrl.value = await QRCode.toDataURL(content, {
      width: w,
      margin: Math.max(0, Number(margin.value) || 0),
      errorCorrectionLevel: 'M',
    })
    encodeOutput.value = dataUrl.value
  } catch (e) {
    dataUrl.value = ''
    encodeOutput.value = ''
    encodeError.value = e instanceof Error ? e.message : '生成失败'
  }
}

function scheduleEncode() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    void runEncode()
  }, 220)
}

async function copyImage() {
  copyTip.value = ''
  if (!dataUrl.value) {
    copyTip.value = '请先生成二维码'
    return
  }
  try {
    if (!navigator.clipboard?.write) {
      copyTip.value = '当前环境不支持复制图片，请使用下载'
      return
    }
    const res = await fetch(dataUrl.value)
    const blob = await res.blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    copyTip.value = '已复制图片'
  } catch {
    copyTip.value = '复制图片失败，请改用下载或复制 Data URL'
  }
}

/** —— 解析 —— */
const decodeOutput = ref('')
const decodeError = ref('')
const previewUrl = ref('')
const dragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function revokePreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
}

function clearDecode() {
  decodeError.value = ''
  decodeOutput.value = ''
  revokePreview()
  if (fileInput.value) fileInput.value.value = ''
}

function decodeFile(file: File) {
  decodeError.value = ''
  decodeOutput.value = ''
  if (!file.type.startsWith('image/')) {
    decodeError.value = '请选择图片文件'
    return
  }
  revokePreview()
  const url = URL.createObjectURL(file)
  previewUrl.value = url
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)
    if (code) decodeOutput.value = code.data
    else decodeError.value = '未识别到二维码'
  }
  img.onerror = () => {
    decodeError.value = '读图失败'
  }
  img.src = url
}

function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) decodeFile(file)
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) decodeFile(file)
}

function pickFile() {
  fileInput.value?.click()
}

function useDecodedAsEncode() {
  if (!decodeOutput.value) return
  text.value = decodeOutput.value
  tab.value = 'encode'
}

const shellError = computed(() => (tab.value === 'encode' ? encodeError.value : decodeError.value))
const shellTitle = computed(() => (tab.value === 'encode' ? '二维码 · 生成' : '二维码 · 解析'))

watch([text, size, margin], () => {
  if (tab.value === 'encode') scheduleEncode()
})

watch(tab, (v) => {
  if (v === 'encode' && !dataUrl.value && text.value.trim()) void runEncode()
})

onMounted(() => {
  if (tab.value === 'encode') void runEncode()
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  revokePreview()
})
</script>

<template>
  <UiToolShell :title="shellTitle" :error="shellError">
    <template #actions>
      <template v-if="tab === 'encode'">
        <button type="button" class="btn" @click="runEncode">生成</button>
        <a
          v-if="dataUrl"
          class="btn btn-ghost"
          :href="dataUrl"
          download="qrcode.png"
        >下载 PNG</a>
        <button
          type="button"
          class="btn btn-ghost"
          :disabled="!dataUrl"
          @click="copyImage"
        >复制图片</button>
        <UiCopyButton :text="encodeOutput" label="复制 Data URL" />
      </template>
      <template v-else>
        <button
          type="button"
          class="btn"
          :disabled="!decodeOutput"
          @click="useDecodedAsEncode"
        >填入生成</button>
        <button type="button" class="btn btn-ghost" @click="clearDecode">清空</button>
        <UiCopyButton :text="decodeOutput" />
      </template>
    </template>

    <template #toolbar>
      <div class="toolbar-row">
        <div class="mode-seg" role="tablist" aria-label="模式">
          <button
            type="button"
            class="mode-seg-btn"
            role="tab"
            :aria-selected="tab === 'encode'"
            :class="{ active: tab === 'encode' }"
            @click="tab = 'encode'"
          >
            生成
          </button>
          <button
            type="button"
            class="mode-seg-btn"
            role="tab"
            :aria-selected="tab === 'decode'"
            :class="{ active: tab === 'decode' }"
            @click="tab = 'decode'"
          >
            解析
          </button>
        </div>
        <div v-if="tab === 'encode'" class="opts">
          <label>尺寸
            <input
              v-model.number="size"
              type="number"
              class="num"
              min="64"
              max="1024"
              step="8"
              style="width:88px"
            />
            <span class="unit">px</span>
          </label>
          <label>边距
            <input
              v-model.number="margin"
              type="number"
              class="num"
              min="0"
              max="8"
              style="width:64px"
            />
          </label>
          <span v-if="copyTip" class="hint tip">{{ copyTip }}</span>
        </div>
        <p v-else class="hint tip">拖放或选择图片，本地 jsQR 解码，数据不出浏览器。</p>
      </div>
    </template>

    <template v-if="tab === 'encode'" #input>
      <label class="lbl">内容</label>
      <textarea
        v-model="text"
        class="ta"
        rows="10"
        spellcheck="false"
        placeholder="文本或 URL…"
      />
      <p class="hint">修改内容或尺寸后会自动重新生成。</p>
    </template>
    <template v-if="tab === 'encode'" #output>
      <label class="lbl">预览</label>
      <div class="preview-card" :class="{ 'is-empty': !dataUrl }">
        <img
          v-if="dataUrl"
          :src="dataUrl"
          class="qrimg"
          :alt="`二维码 ${size}×${size}`"
        />
        <div v-else class="preview-empty">输入内容后自动生成预览</div>
        <div v-if="dataUrl" class="preview-meta">
          <span>{{ size }} × {{ size }}</span>
          <span>PNG</span>
        </div>
      </div>
      <button
        type="button"
        class="dataurl-toggle"
        :aria-expanded="showDataUrl"
        @click="showDataUrl = !showDataUrl"
      >
        {{ showDataUrl ? '收起 Data URL' : '展开 Data URL' }}
      </button>
      <textarea
        v-show="showDataUrl"
        :value="encodeOutput"
        class="ta dataurl-ta"
        rows="4"
        readonly
        placeholder="生成后显示 Data URL…"
      />
    </template>

    <template v-if="tab === 'decode'" #input>
      <label class="lbl">图片</label>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="file-hidden"
        @change="onFile"
      />
      <div
        class="dropzone"
        :class="{ 'is-drag': dragging }"
        role="button"
        tabindex="0"
        @click="pickFile"
        @keydown.enter.prevent="pickFile"
        @dragenter.prevent="dragging = true"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <img v-if="previewUrl" :src="previewUrl" class="thumb" alt="预览" />
        <template v-else>
          <span class="dropzone__title">拖放图片到此处，或点击选择</span>
          <button type="button" class="btn btn-ghost" @click.stop="pickFile">选择图片</button>
        </template>
      </div>
    </template>
    <template v-if="tab === 'decode'" #output>
      <label class="lbl">识别内容</label>
      <textarea
        :value="decodeOutput"
        class="ta"
        rows="12"
        readonly
        placeholder="识别结果…"
      />
    </template>
  </UiToolShell>
</template>

<style scoped>
.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.mode-seg {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  padding: 3px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg-input, var(--bg-card2)) 70%, transparent);
}
.mode-seg-btn {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: 12.5px;
  line-height: 1.2;
  padding: 6px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.mode-seg-btn:hover {
  color: var(--text-strong, var(--text));
}
.mode-seg-btn.active {
  background: color-mix(in srgb, var(--brand, var(--accent)) 22%, transparent);
  color: var(--text-strong, var(--text));
  font-weight: 600;
}
.unit {
  margin-left: 4px;
  color: var(--text-faint);
  font-size: 0.8rem;
}
.tip {
  margin: 0;
}
.preview-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 280px;
  padding: 20px 16px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--bg-elevated) 88%, var(--brand-soft)) 0%, var(--bg-soft) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.preview-card.is-empty {
  border-style: dashed;
}
.qrimg {
  width: min(100%, 280px);
  height: auto;
  aspect-ratio: 1;
  object-fit: contain;
  border-radius: var(--radius-sm);
  background: #fff;
  padding: 12px;
  box-shadow: var(--shadow-sm);
  display: block;
}
.preview-empty {
  color: var(--text-faint);
  font-size: 0.86rem;
  text-align: center;
  padding: 24px 12px;
}
.preview-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-family: var(--mono);
}
.preview-meta span {
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
}
.dataurl-toggle {
  margin-top: 12px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--brand);
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  text-align: left;
}
.dataurl-toggle:hover {
  text-decoration: underline;
}
.dataurl-ta {
  margin-top: 8px;
  font-size: 0.75rem;
  line-height: 1.45;
  word-break: break-all;
}
.file-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 220px;
  padding: 16px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius);
  background: var(--bg-soft);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.dropzone:hover,
.dropzone.is-drag {
  border-color: var(--brand);
  background: var(--brand-soft);
}
.dropzone__title {
  font-size: 0.84rem;
  color: var(--text-muted);
  text-align: center;
}
.thumb {
  max-width: 100%;
  max-height: 240px;
  border-radius: var(--radius-xs);
  object-fit: contain;
  background: #fff;
  padding: 6px;
}
</style>
