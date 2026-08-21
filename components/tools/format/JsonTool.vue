<script setup lang="ts">
import { formatJson, minifyJson, validateJson } from '#shared/format/json'

const SAMPLE = '{\n  "hello": "world",\n  "list": [1, 2, 3]\n}'

const { input, output, error, setOutput, setError, clearError } = useToolState(SAMPLE)

function doFormat() {
  const r = formatJson(input.value, 2)
  if (!r.ok) setError(r.error || '格式化失败')
  else setOutput(r.text)
}

function doMinify() {
  const r = minifyJson(input.value)
  if (!r.ok) setError(r.error || '压缩失败')
  else setOutput(r.text)
}

function doValidate() {
  const r = validateJson(input.value)
  if (!r.ok) setError(r.error || '校验失败')
  else {
    clearError()
    setOutput(r.text)
  }
}

function applyToInput() {
  if (!output.value || output.value === 'JSON 有效') return
  input.value = output.value
  clearError()
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
  <UiToolShell title="JSON 格式化 / 压缩 / 校验" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doFormat">格式化</button>
      <button type="button" class="btn" @click="doMinify">压缩</button>
      <button type="button" class="btn btn-ghost" @click="doValidate">校验</button>
      <button type="button" class="btn btn-ghost" @click="applyToInput">结果→输入</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="14" placeholder="{ ... }" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="14" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>
