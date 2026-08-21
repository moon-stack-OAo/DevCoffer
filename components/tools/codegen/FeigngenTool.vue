<script setup lang="ts">
import { feignSkeleton } from '#shared/codegen/templates'
const path = ref('/api')
const { input, output, error, setOutput, setError, clearError } = useToolState('user-service')
function run() {
  clearError()
  try { setOutput(feignSkeleton(input.value.trim(), path.value)) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="Feign 接口骨架" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts"><label>path <input v-model="path" class="inp" /></label></div>
    </template>
    <template #input>
      <label class="lbl">服务名</label>
      <textarea v-model="input" class="ta" rows="3" />
    </template>
    <template #output>
      <label class="lbl">代码</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>
