<script setup lang="ts">
import { rsaDecrypt, rsaEncrypt, rsaGenerate } from '#shared/security/rsa'
const publicPem = ref('')
const privatePem = ref('')
const { input, output, error, setOutput, setError, clearError } = useToolState('hello rsa')
async function gen() {
  clearError()
  try {
    const k = await rsaGenerate(2048)
    publicPem.value = k.publicPem
    privatePem.value = k.privatePem
  } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
async function enc() {
  clearError()
  try { setOutput(await rsaEncrypt(input.value, publicPem.value)) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
async function dec() {
  clearError()
  try { setOutput(await rsaDecrypt(input.value, privatePem.value)) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="RSA-OAEP" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="gen">生成密钥</button>
      <button type="button" class="btn btn-ghost" @click="enc">加密</button>
      <button type="button" class="btn btn-ghost" @click="dec">解密</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">Web Crypto RSA-OAEP SHA-256 · 明文长度受模数限制</p>
      <div class="grid2" style="margin-top:10px">
        <div>
          <label class="lbl">公钥 PEM</label>
          <textarea v-model="publicPem" class="ta" rows="7" placeholder="-----BEGIN PUBLIC KEY-----" />
        </div>
        <div>
          <label class="lbl">私钥 PEM</label>
          <textarea v-model="privatePem" class="ta" rows="7" placeholder="-----BEGIN PRIVATE KEY-----" />
        </div>
      </div>
    </template>
    <template #input>
      <label class="lbl">明文 / 密文(Base64)</label>
      <textarea v-model="input" class="ta" rows="10" placeholder="加密填明文，解密填 Base64 密文…" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="10" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>
