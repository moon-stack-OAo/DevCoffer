<script setup lang="ts">
import { formatRegexResult, regexReplace, regexTest } from '#shared/text/regex'

const pattern = ref('\\d+')
const flags = ref('g')
const replacement = ref('#$&')
const highlightHtml = ref('')
const { input, output, error, setOutput, setError, clearError } = useToolState('Order #123 and #456')

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHighlight(text: string, pat: string, fl: string) {
  const re = new RegExp(pat, fl.includes('g') ? fl : fl + 'g')
  let last = 0
  let html = ''
  let m: RegExpExecArray | null
  let n = 0
  re.lastIndex = 0
  while ((m = re.exec(text)) !== null) {
    n++
    html += escapeHtml(text.slice(last, m.index))
    html += `<mark>${escapeHtml(m[0])}</mark>`
    last = m.index + m[0].length
    if (m[0].length === 0) re.lastIndex++
    if (n > 200) break
  }
  html += escapeHtml(text.slice(last))
  return html
}

function doMatch() {
  clearError()
  highlightHtml.value = ''
  try {
    setOutput(formatRegexResult(regexTest(pattern.value, flags.value, input.value)))
    highlightHtml.value = buildHighlight(input.value, pattern.value, flags.value)
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function doReplace() {
  clearError()
  highlightHtml.value = ''
  try {
    setOutput(regexReplace(pattern.value, flags.value, input.value, replacement.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}
</script>

<template>
  <UiToolShell title="正则表达式" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doMatch">匹配</button>
      <button type="button" class="btn" @click="doReplace">替换</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">浏览器 JS RegExp；Java 风格见说明（\\d 等需双反斜杠输入）。</p>
      <div class="opts">
        <label>表达式 <input v-model="pattern" class="inp" style="min-width:180px" /></label>
        <label>标志 <input v-model="flags" class="inp" style="width:80px" placeholder="gimsu" /></label>
        <label>替换 <input v-model="replacement" class="inp" style="min-width:120px" /></label>
      </div>
    </template>
    <template #input>
      <label class="lbl">测试文本</label>
      <textarea v-model="input" class="ta" rows="10" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="8" readonly />
      <template v-if="highlightHtml">
        <label class="lbl" style="margin-top:10px">高亮预览</label>
        <pre class="hl-preview" v-html="highlightHtml" />
      </template>
    </template>
  </UiToolShell>
</template>

<style scoped>
.hl-preview {
  margin: 0;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-soft);
  font-family: var(--mono);
  font-size: 0.84rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 80px;
}
.hl-preview :deep(mark) {
  background: rgba(251, 191, 36, 0.35);
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
}
</style>
