<script setup lang="ts">
import { jsonToInsert } from '#shared/format/json2sql'

const SAMPLE = '[\n  {\n    "id": 1,\n    "name": "Alice"\n  },\n  {\n    "id": 2,\n    "name": "Bob"\n  }\n]'

const table = ref('t_user')
const { input, output, error, setOutput, setError, clearError } = useToolState(SAMPLE)

function run() {
  clearError()
  try {
    setOutput(jsonToInsert(input.value, table.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function loadSample() {
  input.value = SAMPLE
  table.value = 't_user'
  clearError()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="JSON → SQL INSERT" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts"><label>表名 <input v-model="table" class="inp" /></label></div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" spellcheck="false" />
    </template>
    <template #output>
      <label class="lbl">SQL</label>
      <textarea :value="output" class="ta" rows="14" readonly placeholder="INSERT …" />
    </template>
  </UiToolShell>
</template>
