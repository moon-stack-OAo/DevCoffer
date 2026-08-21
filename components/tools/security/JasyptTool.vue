<script setup lang="ts">
import { jasyptDecryptDemo, jasyptEncryptDemo } from '#shared/security/jasypt'
const password = ref('password')
const mode = ref<'enc'|'dec'>('enc')
const { input, output, error, setOutput, setError, clearError } = useToolState('secret')
async function run() {
  clearError()
  try {
    if (mode.value === 'enc') setOutput(await jasyptEncryptDemo(input.value, password.value))
    else setOutput(await jasyptDecryptDemo(input.value, password.value))
  } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="Jasypt 风格演示" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">执行</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">非完整 Jasypt PBE 兼容；PBKDF2+AES-GCM 演示，输出 ENC(...)</p>
      <div class="opts">
        <label>模式
          <select v-model="mode" class="sel"><option value="enc">加密</option><option value="dec">解密</option></select>
        </label>
        <label>口令 <input v-model="password" class="inp" /></label>
      </div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="10" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="10" readonly />
    </template>
  </UiToolShell>
</template>
