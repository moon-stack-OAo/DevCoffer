<script setup lang="ts">
import {
  svgoptOptimize,
  svgoptToDataUri,
  svgoptFmtSize,
  SVGOPT_EXAMPLE,
} from '#shared/generate/svgopt'

const { input, output, error, setOutput, setError, clearError } = useToolState('')
const dataUri = ref('')
const stats = ref('')
const previewHtml = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const stripComments = ref(true)
const collapseWhitespace = ref(true)
const stripInkscape = ref(true)
const stripXmlSpace = ref(true)
const stripWidthHeight = ref(false)

function getOpts() {
  return {
    stripComments: stripComments.value,
    collapseWhitespace: collapseWhitespace.value,
    stripInkscape: stripInkscape.value,
    stripXmlSpace: stripXmlSpace.value,
    stripWidthHeight: stripWidthHeight.value,
  }
}

function run() {
  clearError()
  if (!String(input.value || '').trim()) {
    output.value = ''
    dataUri.value = ''
    previewHtml.value = ''
    stats.value = ''
    setError('请粘贴或上传 SVG 源码')
    return
  }
  const r = svgoptOptimize(input.value, getOpts())
  if (!r.ok) {
    setError(r.msg || '优化失败')
    dataUri.value = ''
    previewHtml.value = ''
    stats.value = r.msg || ''
    return
  }
  setOutput(r.svg)
  dataUri.value = svgoptToDataUri(r.svg)
  // 去掉 XML 声明，避免 innerHTML 把它变成注释节点影响预览
  previewHtml.value = r.svg.replace(/^\s*<\?xml[^?]*\?>\s*/i, '')
  const saved = r.before - r.after
  const pct = r.before > 0 ? ((saved / r.before) * 100).toFixed(1) : '0'
  stats.value =
    '优化前 ' +
    svgoptFmtSize(r.before) +
    ' → 优化后 ' +
    svgoptFmtSize(r.after) +
    '（节省 ' +
    svgoptFmtSize(Math.max(0, saved)) +
    ' / ' +
    pct +
    '%）'
}

function loadExample() {
  input.value = SVGOPT_EXAMPLE
  run()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
  dataUri.value = ''
  previewHtml.value = ''
  stats.value = ''
  if (fileInput.value) fileInput.value.value = ''
  clearError()
}

function onFile(e: Event) {
  const el = e.target as HTMLInputElement
  const file = el.files?.[0]
  if (!file) return
  if (!/\.svg$/i.test(file.name) && file.type && !file.type.includes('svg')) {
    setError('请选择 .svg 文件')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    input.value = String(reader.result || '')
    run()
  }
  reader.onerror = () => setError('文件读取失败')
  reader.readAsText(file)
}

function downloadSvg() {
  if (!import.meta.client || !output.value) return
  const blob = new Blob([output.value], { type: 'image/svg+xml;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'optimized.svg'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
</script>

<template>
  <UiToolShell title="SVG 轻量优化" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="run">优化</button>
      <button type="button" class="btn btn-ghost" @click="loadExample">加载示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" label="复制代码" />
      <UiCopyButton :text="dataUri" label="复制 data URI" />
      <button type="button" class="btn btn-ghost" :disabled="!output" @click="downloadSvg">
        下载 SVG
      </button>
    </template>
    <template #toolbar>
      <div class="svo-opts">
        <label class="svo-check">
          <input v-model="stripComments" type="checkbox" @change="run" /> 去掉注释
        </label>
        <label class="svo-check">
          <input v-model="collapseWhitespace" type="checkbox" @change="run" /> 压缩空白
        </label>
        <label class="svo-check">
          <input v-model="stripInkscape" type="checkbox" @change="run" /> 去掉 inkscape/sodipodi
        </label>
        <label class="svo-check">
          <input v-model="stripXmlSpace" type="checkbox" @change="run" /> 去掉 xml:space
        </label>
        <label class="svo-check">
          <input v-model="stripWidthHeight" type="checkbox" @change="run" />
          去掉 width/height（保留 viewBox）
        </label>
      </div>
      <div v-if="stats" class="svo-stats">{{ stats }}</div>
    </template>

    <div class="svo-root">
      <div class="svo-input">
        <label class="lbl">SVG 源码</label>
        <input
          ref="fileInput"
          type="file"
          accept=".svg,image/svg+xml"
          class="inp"
          style="margin-bottom: 8px"
          @change="onFile"
        />
        <textarea
          v-model="input"
          class="ta"
          rows="10"
          placeholder="粘贴 SVG 源码，或上方上传 .svg 文件…"
          spellcheck="false"
          @input="run"
        />
      </div>

      <div class="svo-layout">
        <div class="svo-col">
          <label class="lbl">预览</label>
          <div class="svo-preview">
            <ClientOnly>
              <div v-if="previewHtml" class="svo-preview__inner" v-html="previewHtml" />
              <span v-else class="svo-preview-empty">粘贴或上传 SVG 后显示预览</span>
              <template #fallback>
                <span class="svo-preview-empty">粘贴或上传 SVG 后显示预览</span>
              </template>
            </ClientOnly>
          </div>
        </div>
        <div class="svo-col">
          <label class="lbl">优化后代码</label>
          <textarea
            :value="output"
            class="ta"
            rows="8"
            readonly
            placeholder="优化结果…"
            spellcheck="false"
          />
          <label class="lbl svo-uri-lbl">data URI</label>
          <textarea
            :value="dataUri"
            class="ta"
            rows="3"
            readonly
            placeholder="data:image/svg+xml,…"
            spellcheck="false"
          />
        </div>
      </div>

      <div class="svo-hint">
        <div><b>说明</b></div>
        <div>· 轻量自研优化：注释、多余空白、Inkscape/Sodipodi 属性、xml:space；可选去掉 width/height</div>
        <div>· 非 SVGO 全量压缩；复杂 SVG 请用专业工具二次优化</div>
      </div>
    </div>
  </UiToolShell>
</template>

<style scoped>
.svo-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  flex: 1 1 auto;
  overflow: auto;
}
.svo-input {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.svo-input .ta {
  min-height: 160px;
  resize: vertical;
}
.svo-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.svo-col .ta {
  min-height: 120px;
  resize: vertical;
}
.svo-uri-lbl {
  margin-top: 10px;
}
.svo-preview__inner {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
}
.svo-preview__inner :deep(svg) {
  max-width: 100%;
  max-height: 240px;
  height: auto;
}
.svo-preview-empty {
  color: var(--text-dim);
  font-size: 13px;
}
</style>
