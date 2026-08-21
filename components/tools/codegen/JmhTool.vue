<script setup lang="ts">
import { testGenTemplate } from '#shared/codegen/templates'
const { input, output, error, setOutput, setError, clearError } = useToolState('Sample')
function run() {
  clearError()
  try { setOutput(testGenTemplate(input.value.trim() || 'Sample', 'jmh')) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="JMH 基准骨架" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="3" />
    </template>
    <template #output>
      <label class="lbl">代码</label>
      <textarea :value="output" class="ta" rows="16" readonly />
    </template>
  </UiToolShell>
</template>
