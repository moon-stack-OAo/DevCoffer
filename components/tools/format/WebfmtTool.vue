<script setup lang="ts">
import { formatHtml } from '#shared/format/webfmt'

const SAMPLE = '<div><p>hi</p><br/><span>x</span></div>'

const { input, output, error, setOutput, setError, clearError } = useToolState(SAMPLE)

function run() {
  clearError()
  try {
    setOutput(formatHtml(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function loadSample() {
  input.value = SAMPLE
  clearError()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="HTML 格式化" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">执行</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="10" spellcheck="false" />
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="14" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>
