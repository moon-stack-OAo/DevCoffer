<script setup lang="ts">
import { parsePemCert } from '#shared/security/certparser'
const { input, output, error, setOutput, setError, clearError } = useToolState('-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----')
function run() {
  clearError()
  try { setOutput(parsePemCert(input.value)) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="证书 PEM 解析" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">解析</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">文本级 PEM 摘要，非完整 ASN.1</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" />
    </template>
    <template #output>
      <label class="lbl">摘要</label>
      <textarea :value="output" class="ta" rows="12" readonly />
    </template>
  </UiToolShell>
</template>
