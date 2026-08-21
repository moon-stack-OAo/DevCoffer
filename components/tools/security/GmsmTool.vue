<script setup lang="ts">
import { gmsmDemoDigest, gmsmInfo } from '#shared/security/gmsm'
const { input, output, error, setOutput, setError, clearError } = useToolState('demo')
function run() {
  clearError()
  setOutput(gmsmInfo() + '\n\n演示摘要: ' + gmsmDemoDigest(input.value))
}
run()
</script>
<template>
  <UiToolShell title="国密 SM2/3/4（占位）" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">说明</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">完整国密需专用库；当前为占位说明</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="6" />
    </template>
    <template #output>
      <label class="lbl">说明</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>
