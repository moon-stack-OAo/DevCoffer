<script setup lang="ts">
import { jsonFlatten, jsonUnflatten, JSONFLAT_SAMPLE } from '#shared/format/jsonflat'

const { input, output, error, setOutput, setError, clearError } = useToolState(JSONFLAT_SAMPLE)
const arrayStyle = ref<'bracket' | 'dot'>('bracket')

function flatten() {
  clearError()
  const r = jsonFlatten(input.value, { arrayStyle: arrayStyle.value })
  if (!r.ok) setError(r.msg)
  else setOutput(r.result || '')
}

function unflatten() {
  clearError()
  const r = jsonUnflatten(input.value, { arrayStyle: arrayStyle.value })
  if (!r.ok) setError(r.msg)
  else setOutput(r.result || '')
}

function swap() {
  input.value = output.value
  output.value = ''
  clearError()
}

function loadSample() {
  input.value = JSONFLAT_SAMPLE
  clearError()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="JSON 扁平化" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="flatten">扁平化</button>
      <button type="button" class="btn" @click="unflatten">反扁平</button>
      <button type="button" class="btn btn-ghost" @click="swap">结果→输入</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>数组路径
          <select v-model="arrayStyle" class="sel">
            <option value="bracket">bracket a[0]</option>
            <option value="dot">dot a.0</option>
          </select>
        </label>
      </div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" placeholder="{ ... }" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>
