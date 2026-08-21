<script setup lang="ts">
import { jsonToTs } from '#shared/codegen/json2ts'

const rootName = ref('Root')
const style = ref<'interface' | 'type'>('interface')
const { input, output, error, setOutput, setError, clearError } = useToolState('{\n  "id": 1,\n  "name": "Alice",\n  "profile": { "age": 30 }\n}')

function doGen() {
  clearError()
  try { setOutput(jsonToTs(input.value, rootName.value, style.value)) } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>

<template>
  <UiToolShell title="JSON → TypeScript" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doGen">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>根名 <input v-model="rootName" class="inp" /></label>
        <label>风格
          <select v-model="style" class="sel">
            <option value="interface">interface</option>
            <option value="type">type</option>
          </select>
        </label>
      </div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" />
    </template>
    <template #output>
      <label class="lbl">代码</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>

