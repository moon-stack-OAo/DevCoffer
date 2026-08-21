<script setup lang="ts">
import { buildAuthorizeUrl, generatePkce } from '#shared/security/oauth2pkce'

const { output, error, setOutput, setError, clearError, reset } = useToolState()
const verifierLen = ref(64)
const verifier = ref('')
const challenge = ref('')
const authorizeUrl = ref('https://example.com/oauth/authorize')
const clientId = ref('client-id')
const redirectUri = ref('https://app.example.com/callback')
const scope = ref('openid profile')
const state = ref('')
const busy = ref(false)

async function gen() {
    clearError()
    busy.value = true
    try {
        const p = await generatePkce({ verifierLength: verifierLen.value })
        verifier.value = p.code_verifier
        challenge.value = p.code_challenge
        setOutput(
            [
                `code_verifier:\n${p.code_verifier}`,
                '',
                `code_challenge (S256):\n${p.code_challenge}`,
                '',
                `code_challenge_method: ${p.code_challenge_method}`,
            ].join('\n'),
        )
    } catch (e) {
        setError(e instanceof Error ? e.message : '生成失败')
    } finally {
        busy.value = false
    }
}

function buildUrl() {
    clearError()
    try {
        if (!challenge.value) throw new Error('请先生成 PKCE')
        const url = buildAuthorizeUrl({
            authorizeUrl: authorizeUrl.value,
            clientId: clientId.value,
            redirectUri: redirectUri.value,
            codeChallenge: challenge.value,
            scope: scope.value,
            state: state.value || undefined,
        })
        // 覆盖写入，避免多次构造授权 URL 时无限追加
        const base = [
            verifier.value ? `code_verifier:\n${verifier.value}` : '',
            challenge.value ? `code_challenge (S256):\n${challenge.value}` : '',
            'code_challenge_method: S256',
        ]
            .filter(Boolean)
            .join('\n\n')
        setOutput((base ? base + '\n\n' : '') + 'authorize URL:\n' + url)
    } catch (e) {
        setError(e instanceof Error ? e.message : '构造失败')
    }
}

function clearAll() {
    reset()
    verifier.value = ''
    challenge.value = ''
}

// 已有 challenge 时，授权参数变更自动重算 URL
watch([authorizeUrl, clientId, redirectUri, scope, state], () => {
    if (challenge.value) buildUrl()
})

onMounted(() => gen())
</script>

<template>
  <ClientOnly>
    <UiToolShell title="OAuth2 PKCE" :error="error" :dual="false">
      <template #actions>
        <label class="opt">verifier 长度
          <input v-model.number="verifierLen" type="number" min="43" max="128" class="num" />
        </label>
        <button type="button" class="btn" :disabled="busy" @click="gen">生成 PKCE</button>
        <button type="button" class="btn btn-ghost" @click="buildUrl">构造授权 URL</button>
        <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
        <UiCopyButton :text="output" />
      </template>
      <div class="grid">
        <label class="lbl">Authorize URL</label>
        <input v-model="authorizeUrl" class="inp" />
        <label class="lbl">client_id</label>
        <input v-model="clientId" class="inp" />
        <label class="lbl">redirect_uri</label>
        <input v-model="redirectUri" class="inp" />
        <label class="lbl">scope</label>
        <input v-model="scope" class="inp" />
        <label class="lbl">state（可选）</label>
        <input v-model="state" class="inp" />
      </div>
      <label class="lbl" style="margin-top:12px">结果</label>
      <textarea :value="output" class="ta" rows="12" readonly />
    </UiToolShell>
    <template #fallback>
      <p class="hint">PKCE 需浏览器 Web Crypto…</p>
    </template>
  </ClientOnly>
</template>

<style scoped>
.num { width: 64px; }
</style>
