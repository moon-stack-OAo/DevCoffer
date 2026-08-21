<script setup lang="ts">
import { parseJwt } from '#shared/security/jwt'

const { input, error, setError, clearError, reset } = useToolState()
const header = ref('')
const payload = ref('')
const meta = ref('')

function decode() {
    clearError()
    header.value = ''
    payload.value = ''
    meta.value = ''
    try {
        const r = parseJwt(input.value)
        header.value = JSON.stringify(r.header, null, 2)
        payload.value = JSON.stringify(r.payload, null, 2)
        const sigShort = r.signature.slice(0, 24) + (r.signature.length > 24 ? '…' : '')
        if (r.expIso != null) {
            meta.value = `签名: ${sigShort} | 过期: ${r.expIso} ${r.expired ? '(已过期)' : '(有效)'} | 本工具不验签`
        } else {
            meta.value = `签名: ${sigShort} | (无 exp) | 本工具不验签`
        }
    } catch (e) {
        setError(e instanceof Error ? e.message : '解码失败')
    }
}

function clearAll() {
    reset()
    header.value = ''
    payload.value = ''
    meta.value = ''
}

watch(input, () => {
    if (input.value.trim()) decode()
})
</script>

<template>
  <UiToolShell title="JWT 解码（不验签）" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="decode">解码</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="payload" />
    </template>
    <template #toolbar>
      <p class="hint">仅解析 Base64URL 展示 header/payload，不做签名校验。</p>
    </template>
    <label class="lbl">Token</label>
    <textarea v-model="input" class="ta" rows="4" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…" />
    <div class="grid2" style="margin-top:12px">
      <div>
        <label class="lbl">Header</label>
        <textarea :value="header" class="ta" rows="10" readonly />
      </div>
      <div>
        <label class="lbl">Payload</label>
        <textarea :value="payload" class="ta" rows="10" readonly />
      </div>
    </div>
    <p v-if="meta" class="meta" :class="{ expired: meta.includes('已过期') }">{{ meta }}</p>
  </UiToolShell>
</template>

<style scoped>
.meta {
  margin: 10px 0 0;
  font-size: 0.8rem;
  color: var(--brand);
  word-break: break-all;
}
.meta.expired { color: var(--danger); }
</style>
