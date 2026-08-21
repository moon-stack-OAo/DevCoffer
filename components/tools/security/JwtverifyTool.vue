<script setup lang="ts">
import { jwtVerifyHs256 } from '#shared/security/jwtgen'
const secret = ref('secret')
const { input, output, error, setOutput, setError, clearError } = useToolState()
async function run() {
  clearError()
  try { setOutput(await jwtVerifyHs256(input.value, secret.value)) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="JWT 校验 (HS256)" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">校验</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts"><label>secret <input v-model="secret" class="inp" style="width:220px" /></label></div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="8" placeholder="header.payload.signature" />
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>
