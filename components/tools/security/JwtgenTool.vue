<script setup lang="ts">
import { jwtSignHs256 } from '#shared/security/jwtgen'
const secret = ref('secret')
const { input, output, error, setOutput, setError, clearError } = useToolState('{\n  "sub": "123",\n  "name": "Alice"\n}')
async function run() {
  clearError()
  try {
    const payload = JSON.parse(input.value)
    const now = Math.floor(Date.now()/1000)
    if (payload.iat == null) payload.iat = now
    if (payload.exp == null) payload.exp = now + 3600
    setOutput(await jwtSignHs256(payload, secret.value))
  } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="JWT 生成 (HS256)" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">签名</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">仅 HMAC-SHA256（Web Crypto）</p>
      <div class="opts"><label>secret <input v-model="secret" class="inp" style="width:220px" /></label></div>
    </template>
    <template #input>
      <label class="lbl">payload JSON</label>
      <textarea v-model="input" class="ta" rows="10" />
    </template>
    <template #output>
      <label class="lbl">JWT</label>
      <textarea :value="output" class="ta" rows="8" readonly />
    </template>
  </UiToolShell>
</template>
