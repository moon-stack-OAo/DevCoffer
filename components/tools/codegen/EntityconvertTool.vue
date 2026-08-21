<script setup lang="ts">
import { entityConvertTemplate } from '#shared/codegen/templates'
const { input, output, error, setOutput, setError, clearError } = useToolState('User')
function run() {
  clearError()
  try { setOutput(entityConvertTemplate(input.value.trim() || 'User')) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="DO/DTO 转换模板" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      <label class="lbl">实体名前缀</label>
      <textarea v-model="input" class="ta" rows="3" />
    </template>
    <template #output>
      <label class="lbl">代码</label>
      <textarea :value="output" class="ta" rows="16" readonly />
    </template>
  </UiToolShell>
</template>
