<script setup lang="ts">
import { formatCss, minifyCss, CSSFMT_SAMPLE } from '#shared/format/cssfmt'

const { input, output, error, setOutput, setError, clearError } = useToolState(CSSFMT_SAMPLE)
const indent = ref(4)

function doFormat() {
  clearError()
  try {
    setOutput(formatCss(input.value, indent.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function doMin() {
  clearError()
  try {
    if (!String(input.value || '').trim()) {
      setError('请输入 CSS')
      return
    }
    setOutput(minifyCss(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function loadSample() {
  input.value = CSSFMT_SAMPLE
  clearError()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="CSS 格式化" :error="error">
    <template #actions>
      <label class="opts-inline">
        缩进
        <select v-model.number="indent" class="sel">
          <option :value="2">2 空格</option>
          <option :value="4">4 空格</option>
        </select>
      </label>
      <button type="button" class="btn" @click="doFormat">格式化</button>
      <button type="button" class="btn btn-ghost" @click="doMin">压缩</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">格式化使用 js-beautify；压缩为纯函数去注释/空白。</p>
    </template>
    <template #input>
      <label class="lbl">输入 CSS</label>
      <textarea
        v-model="input"
        class="ta"
        rows="12"
        placeholder=".a{color:red;background:#fff;padding:10px 20px}"
        spellcheck="false"
      />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>

<style scoped>
.opts-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--text-muted);
}
.opts-inline .sel {
  width: auto;
  min-width: 90px;
}
</style>
