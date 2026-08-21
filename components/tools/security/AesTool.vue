<script setup lang="ts">
import { aesDecrypt, aesEncrypt } from '#shared/security/aes'
const password = ref('change-me-32bytes!!!!!!!!!!!!!')
const mode = ref<'enc'|'dec'>('enc')
const { input, output, error, setOutput, setError, clearError } = useToolState('hello aes')
async function run() {
  clearError()
  try {
    if (mode.value === 'enc') setOutput(await aesEncrypt(input.value, password.value))
    else setOutput(await aesDecrypt(input.value, password.value))
  } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="AES-GCM 加解密" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">执行</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>模式
          <select v-model="mode" class="sel">
            <option value="enc">加密</option>
            <option value="dec">解密</option>
          </select>
        </label>
        <label>口令 <input v-model="password" class="inp" style="min-width:240px" /></label>
      </div>
      <p class="hint">Web Crypto AES-GCM；口令会 pad/slice 到 32 字节（演示用途，勿用于生产密钥管理）。</p>
    </template>
    <template #input>
      <label class="lbl">{{ mode === 'enc' ? '明文' : '密文' }}</label>
      <textarea v-model="input" class="ta" rows="12" :placeholder="mode === 'enc' ? '待加密文本…' : '待解密内容…'" />
    </template>
    <template #output>
      <label class="lbl">{{ mode === 'enc' ? '密文' : '明文' }}</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>
