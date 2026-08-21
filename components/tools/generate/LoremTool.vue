<script setup lang="ts">
import { loremGenerate, loremPlaceholderDataUrl } from '#shared/generate/lorem'

const tab = ref<'text' | 'img'>('text')
const lang = ref<'en' | 'zh'>('en')
const paragraphs = ref(3)
const sentences = ref(4)
const width = ref(320)
const height = ref(180)
const bg = ref('#cccccc')
const fg = ref('#333333')
const phText = ref('')
const dataUrl = ref('')
const { output, error, setOutput, setError, clearError } = useToolState()

const downloadName = computed(() => `placeholder-${width.value}x${height.value}.png`)

function runText() {
    clearError()
    setOutput(
        loremGenerate({
            lang: lang.value,
            paragraphs: paragraphs.value,
            sentences: sentences.value,
        }),
    )
}

function runImg() {
    clearError()
    const r = loremPlaceholderDataUrl({
        width: width.value,
        height: height.value,
        bg: bg.value,
        fg: fg.value,
        text: phText.value.trim() || undefined,
    })
    if (!r.ok) {
        dataUrl.value = ''
        setOutput('')
        setError(r.msg)
        return
    }
    dataUrl.value = r.dataUrl
    setOutput(r.dataUrl)
}

function run() {
    if (tab.value === 'img') runImg()
    else runText()
}

function clearAll() {
    clearError()
    setOutput('')
    dataUrl.value = ''
}

watch(tab, (v) => {
    if (v === 'text') runText()
    else if (dataUrl.value) setOutput(dataUrl.value)
    else runImg()
})

watch([lang, paragraphs, sentences], () => {
    if (tab.value === 'text') runText()
})

watch([width, height, bg, fg, phText], () => {
    if (tab.value === 'img') runImg()
})

onMounted(() => runText())
</script>

<template>
  <UiToolShell title="Lorem / 占位图" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="run">{{ tab === 'img' ? '生成占位图' : '生成' }}</button>
      <a v-if="tab === 'img' && dataUrl" class="btn btn-ghost" :href="dataUrl" :download="downloadName">下载 PNG</a>
      <UiCopyButton v-if="tab === 'text' || dataUrl" :text="output" />
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
    </template>
    <template #toolbar>
      <div class="opts">
        <label>模式
          <select v-model="tab" class="sel">
            <option value="text">假文</option>
            <option value="img">占位图</option>
          </select>
        </label>
        <template v-if="tab === 'text'">
          <label>语言
            <select v-model="lang" class="sel">
              <option value="en">英文 Lorem</option>
              <option value="zh">中文假文</option>
            </select>
          </label>
          <label>段落 <input v-model.number="paragraphs" type="number" min="1" max="50" class="num" /></label>
          <label>每段句数 <input v-model.number="sentences" type="number" min="1" max="40" class="num" /></label>
        </template>
        <template v-else>
          <label>宽度 <input v-model.number="width" type="number" min="1" max="4000" class="num" /></label>
          <label>高度 <input v-model.number="height" type="number" min="1" max="4000" class="num" /></label>
          <label>背景色 <input v-model="bg" type="color" /></label>
          <label>文字色 <input v-model="fg" type="color" /></label>
          <label>文字 <input v-model="phText" class="inp" placeholder="留空则显示尺寸" style="min-width:160px" /></label>
        </template>
      </div>
    </template>
    <template v-if="tab === 'text'">
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="16" readonly placeholder="点击生成…" />
    </template>
    <template v-else>
      <label class="lbl">预览</label>
      <div class="preview">
        <img v-if="dataUrl" :src="dataUrl" class="phimg" alt="占位图" />
        <span v-else class="empty">尚未生成</span>
      </div>
      <label class="lbl">Data URL</label>
      <textarea :value="output" class="ta" rows="4" readonly placeholder="生成后显示…" />
    </template>
  </UiToolShell>
</template>

<style scoped>
.num { width: 56px; }
.preview {
  margin-bottom: 12px;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.15);
  padding: 12px;
  overflow: auto;
}
.phimg {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: var(--radius-sm);
}
.empty {
  color: var(--text-muted, #94a3b8);
  font-size: 13px;
}
</style>
