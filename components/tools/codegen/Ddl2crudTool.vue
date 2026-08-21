<script setup lang="ts">
import { ddlToCrud } from '#shared/codegen/ddl2crud'
const className = ref('User')
const { input, output, error, setOutput, setError, clearError } = useToolState('CREATE TABLE user (\n  id BIGINT,\n  name VARCHAR(50)\n)')
function run() {
  clearError()
  try { setOutput(ddlToCrud(input.value, className.value)) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="DDL → CRUD 模板" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts"><label>类名 <input v-model="className" class="inp" /></label></div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="10" />
    </template>
    <template #output>
      <label class="lbl">模板</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>
