<script setup lang="ts">
import {
  FONTPREVIEW_SAMPLE_TEXTS,
  fontpreviewIsSupportedExt,
  fontpreviewSampleTexts,
  fontpreviewClampSize,
  fontpreviewClampLineHeight,
  fontpreviewFmtBytes,
  fontpreviewFamilyCss,
  type FontpreviewSampleKey,
} from '#shared/generate/fontpreview'

const { error, setError, clearError } = useToolState()

const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('未选择字体')
const size = ref(24)
const weight = ref('400')
const lineHeight = ref(1.5)
const sample = ref(FONTPREVIEW_SAMPLE_TEXTS.mix)
const sampleKey = ref<FontpreviewSampleKey | ''>('mix')
const status = ref('')
const dragOver = ref(false)

const objectUrl = ref<string | null>(null)
const family = ref('')
let face: FontFace | null = null

const previewStyle = computed(() => ({
  fontSize: fontpreviewClampSize(size.value) + 'px',
  fontWeight: weight.value,
  lineHeight: String(fontpreviewClampLineHeight(lineHeight.value)),
  fontFamily: fontpreviewFamilyCss(family.value),
}))

const sizeLabel = computed(() => fontpreviewClampSize(size.value) + 'px')
const lhLabel = computed(() => String(Number(fontpreviewClampLineHeight(lineHeight.value).toFixed(2))))

function revokeFont() {
  if (objectUrl.value) {
    try {
      URL.revokeObjectURL(objectUrl.value)
    } catch {
      // ignore
    }
    objectUrl.value = null
  }
  if (face && typeof document !== 'undefined' && document.fonts) {
    try {
      document.fonts.delete(face)
    } catch {
      // ignore
    }
  }
  face = null
  family.value = ''
}

async function loadFile(file: File | undefined | null) {
  if (!file || !import.meta.client) return
  clearError()
  if (!fontpreviewIsSupportedExt(file.name)) {
    setError('请上传 ttf / otf / woff / woff2 字体文件')
    status.value = '不支持的字体格式'
    if (fileInput.value) fileInput.value.value = ''
    return
  }
  if (typeof FontFace === 'undefined') {
    setError('当前浏览器不支持 FontFace')
    return
  }

  revokeFont()
  objectUrl.value = URL.createObjectURL(file)
  family.value = 'fp-font-' + Date.now()
  fileName.value = file.name + ' · ' + fontpreviewFmtBytes(file.size)
  status.value = '正在加载…'

  const next = new FontFace(family.value, 'url(' + objectUrl.value + ')')
  face = next
  try {
    const loaded = await next.load()
    if (document.fonts?.add) document.fonts.add(loaded)
    face = loaded
    status.value = '已加载：' + file.name
  } catch (e) {
    revokeFont()
    fileName.value = '加载失败'
    status.value = '字体加载失败'
    setError('字体加载失败：' + (e instanceof Error ? e.message : String(e)))
  }
}

function onFile(ev: Event) {
  const input = ev.target as HTMLInputElement
  void loadFile(input.files?.[0])
}

function openPicker() {
  fileInput.value?.click()
}

function onDrop(ev: DragEvent) {
  ev.preventDefault()
  dragOver.value = false
  const file = ev.dataTransfer?.files?.[0]
  void loadFile(file)
}

function onDragOver(ev: DragEvent) {
  ev.preventDefault()
  dragOver.value = true
}

function onDragLeave() {
  dragOver.value = false
}

function setSample(key: FontpreviewSampleKey) {
  sampleKey.value = key
  sample.value = String(fontpreviewSampleTexts(key))
}

function onSampleInput() {
  sampleKey.value = ''
}

function resetAll() {
  if (fileInput.value) fileInput.value.value = ''
  fileName.value = '未选择字体'
  size.value = 24
  weight.value = '400'
  lineHeight.value = 1.5
  sample.value = FONTPREVIEW_SAMPLE_TEXTS.mix
  sampleKey.value = 'mix'
  status.value = '已重置'
  clearError()
  revokeFont()
}

onBeforeUnmount(() => {
  revokeFont()
})
</script>

<template>
  <UiToolShell title="字体预览" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn btn-ghost" @click="resetAll">重置</button>
      <span v-if="status" class="fp-status">{{ status }}</span>
    </template>

    <div class="fp-root">
    <div class="fp-layout">
      <div class="fp-controls">
        <section class="fp-card">
          <div class="lbl">字体文件</div>
          <div
            class="fp-drop"
            :class="{ 'is-over': dragOver, 'has-file': !!family }"
            role="button"
            tabindex="0"
            @click="openPicker"
            @keydown.enter.prevent="openPicker"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
          >
            <div class="fp-drop-title">{{ family ? '点击更换字体' : '点击或拖拽字体文件' }}</div>
            <div class="fp-drop-sub">支持 ttf / otf / woff / woff2</div>
            <div class="fp-filename">{{ fileName }}</div>
          </div>
          <input
            ref="fileInput"
            type="file"
            class="fp-file-hidden"
            accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
            @change="onFile"
          />
        </section>

        <section class="fp-card">
          <div class="fp-opts">
            <div class="fp-field">
              <div class="fp-field-head">
                <span>字号</span>
                <span class="fp-val">{{ sizeLabel }}</span>
              </div>
              <input v-model.number="size" type="range" min="8" max="120" />
            </div>
            <div class="fp-field">
              <div class="fp-field-head">
                <span>字重</span>
                <span class="fp-val">{{ weight }}</span>
              </div>
              <select v-model="weight" class="sel fp-weight">
                <option value="100">100 Thin</option>
                <option value="200">200 Extra Light</option>
                <option value="300">300 Light</option>
                <option value="400">400 Regular</option>
                <option value="500">500 Medium</option>
                <option value="600">600 Semi Bold</option>
                <option value="700">700 Bold</option>
                <option value="800">800 Extra Bold</option>
                <option value="900">900 Black</option>
              </select>
            </div>
            <div class="fp-field">
              <div class="fp-field-head">
                <span>行高</span>
                <span class="fp-val">{{ lhLabel }}</span>
              </div>
              <input v-model.number="lineHeight" type="range" min="0.8" max="3" step="0.05" />
            </div>
          </div>
        </section>

        <section class="fp-card fp-card--text">
          <div class="lbl">预览文本</div>
          <div class="fp-samples">
            <button
              type="button"
              class="chip"
              :class="{ active: sampleKey === 'zh' }"
              @click="setSample('zh')"
            >
              中文样张
            </button>
            <button
              type="button"
              class="chip"
              :class="{ active: sampleKey === 'en' }"
              @click="setSample('en')"
            >
              英文样张
            </button>
            <button
              type="button"
              class="chip"
              :class="{ active: sampleKey === 'mix' }"
              @click="setSample('mix')"
            >
              中英混合
            </button>
          </div>
          <textarea
            v-model="sample"
            class="ta fp-text"
            rows="5"
            spellcheck="false"
            @input="onSampleInput"
          />
        </section>
      </div>

      <div class="fp-side">
        <div class="fp-side-head">
          <span class="lbl">预览</span>
          <span class="fp-meta">{{ sizeLabel }} · {{ weight }} · LH {{ lhLabel }}</span>
        </div>
        <div class="fp-preview" :style="previewStyle">{{ sample }}</div>
      </div>
    </div>
    <div class="fp-hint">
      本地字体经 Object URL + FontFace 加载；离开或重置时会 revoke，不上传服务器。
    </div>
    </div>
  </UiToolShell>
</template>

<style scoped>
.fp-root {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}
.fp-status {
  font-size: 12.5px;
  color: var(--text-dim);
  align-self: center;
}
.fp-file-hidden {
  display: none;
}
</style>
