<script setup lang="ts">
import { jsonToCode } from '#shared/codegen/templates'
const lang = ref('java')
const root = ref('Root')
const { input, output, error, setOutput, setError, clearError } = useToolState('{\n  "id": 1,\n  "name": "A"\n}')
function run() {
  clearError()
  try { setOutput(jsonToCode(input.value, lang.value, root.value)) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="JSON → 多语言骨架" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>语言
          <select v-model="lang" class="sel">
            <option value="java">Java</option>
            <option value="ts">TypeScript</option>
            <option value="go">Go</option>
            <option value="python">Python</option>
          </select>
        </label>
        <label>根名 <input v-model="root" class="inp" /></label>
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
