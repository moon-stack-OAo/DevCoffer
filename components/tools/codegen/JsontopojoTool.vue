<script setup lang="ts">
import { jsonToPojo } from '#shared/codegen/jsontopojo'

const className = ref('User')
const lombok = ref(true)
const { input, output, error, setOutput, setError, clearError } = useToolState('{\n  "id": 1,\n  "name": "Alice",\n  "tags": ["a", "b"],\n  "active": true\n}')

function doGen() {
  clearError()
  try { setOutput(jsonToPojo(input.value, className.value, lombok.value)) } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>

<template>
  <UiToolShell title="JSON → Java POJO" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doGen">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>类名 <input v-model="className" class="inp" /></label>
        <label><input v-model="lombok" type="checkbox" /> @Data</label>
      </div>
      <p class="hint">嵌套对象简化为 Map；数组为 List。</p>
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

