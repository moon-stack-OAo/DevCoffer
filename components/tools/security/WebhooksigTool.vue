<script setup lang="ts">
import { generateWebhookSig, verifyWebhookSig } from '#shared/security/webhooksig'
import type { HmacAlgo } from '#shared/security/hmac'
const mode = ref<'generate' | 'verify'>('generate')
const secret = ref('whsec')
const sig = ref('')
const algo = ref<HmacAlgo>('SHA256')
const { input, output, error, setOutput, setError, clearError } = useToolState('{"ok":true}')
async function run() {
  clearError()
  try {
    if (mode.value === 'generate') {
      setOutput(await generateWebhookSig({ secret: secret.value, body: input.value, algo: algo.value }))
    } else {
      setOutput(await verifyWebhookSig({ secret: secret.value, body: input.value, signature: sig.value, algo: algo.value }))
    }
  } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="Webhook 签名" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">{{ mode === 'generate' ? '生成' : '校验' }}</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label><input v-model="mode" type="radio" value="generate" /> 生成</label>
        <label><input v-model="mode" type="radio" value="verify" /> 校验</label>
        <label>secret <input v-model="secret" class="inp" /></label>
        <label>算法
          <select v-model="algo" class="sel">
            <option>MD5</option><option>SHA1</option><option>SHA256</option><option>SHA384</option><option>SHA512</option>
          </select>
        </label>
      </div>
    </template>
    <template #input>
      <template v-if="mode === 'verify'">
        <label class="lbl">签名（支持 sha256=hex）</label>
        <input v-model="sig" class="inp" style="width:100%;margin-bottom:8px" />
      </template>
      <label class="lbl">Body / Payload</label>
      <textarea v-model="input" class="ta" rows="10" />
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="10" readonly />
    </template>
  </UiToolShell>
</template>
