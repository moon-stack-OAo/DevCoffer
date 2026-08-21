<script setup lang="ts">
import { validateJsonSchema } from '#shared/format/jsonschema'

const SAMPLE_DATA = '{\n  "name": "a",\n  "age": 1\n}'
const SAMPLE_SCHEMA = [
  '{',
  '  "type": "object",',
  '  "required": ["name"],',
  '  "properties": {',
  '    "name": { "type": "string" },',
  '    "age": { "type": "integer" }',
  '  }',
  '}',
].join('\n')

const data = ref(SAMPLE_DATA)
const schema = ref(SAMPLE_SCHEMA)
const { output, error, setOutput, setError, clearError } = useToolState()

function run() {
  clearError()
  try {
    setOutput(validateJsonSchema(data.value, schema.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function loadSample() {
  data.value = SAMPLE_DATA
  schema.value = SAMPLE_SCHEMA
  clearError()
}

function clearAll() {
  data.value = ''
  schema.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="JSON Schema（基础）" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="run">校验</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">仅支持 type / required / properties / items / enum 子集</p>
    </template>
    <div class="grid2">
      <div>
        <label class="lbl">数据</label>
        <textarea v-model="data" class="ta" rows="12" spellcheck="false" />
      </div>
      <div>
        <label class="lbl">Schema</label>
        <textarea v-model="schema" class="ta" rows="12" spellcheck="false" />
      </div>
    </div>
    <label class="lbl" style="margin-top:12px">结果</label>
    <textarea :value="output" class="ta" rows="10" readonly placeholder="校验结果…" />
  </UiToolShell>
</template>
