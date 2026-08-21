<script setup lang="ts">
import {
    formatOtp,
    remainingSeconds,
    totp,
    verifyOtp,
    parseOtpauthUri,
} from '#shared/security/totp'

const secret = ref('')
const algo = ref('SHA-1')
const digits = ref(6)
const period = ref(30)
const code = ref('')
const display = ref('------')
const remain = ref(30)
const verifyInput = ref('')
const verifyMsg = ref('')
const { error, setError, clearError } = useToolState()
let timer: ReturnType<typeof setInterval> | null = null

async function refresh() {
    clearError()
    remain.value = remainingSeconds(period.value)
    if (!secret.value.trim()) {
        display.value = '------'
        code.value = ''
        return
    }
    try {
        code.value = await totp(secret.value.trim(), Date.now(), period.value, digits.value, algo.value)
        display.value = formatOtp(code.value, digits.value)
    } catch (e) {
        setError(e instanceof Error ? e.message : '生成失败')
        display.value = '------'
    }
}

async function doVerify() {
    clearError()
    verifyMsg.value = ''
    if (!secret.value.trim()) {
        setError('请先填写密钥')
        return
    }
    try {
        const r = await verifyOtp(verifyInput.value, secret.value.trim(), period.value, digits.value, algo.value)
        verifyMsg.value = r.valid
            ? `校验通过${r.offset ? `（漂移 ${r.offset} 步）` : ''}`
            : '校验失败'
    } catch (e) {
        setError(e instanceof Error ? e.message : '校验失败')
    }
}

function importUri() {
    clearError()
    try {
        const info = parseOtpauthUri(secret.value.trim())
        secret.value = info.secret
        algo.value = info.algorithm
        digits.value = info.digits
        period.value = info.period
        refresh()
    } catch (e) {
        setError(e instanceof Error ? e.message : 'URI 解析失败')
    }
}

onMounted(() => {
    refresh()
    timer = setInterval(refresh, 1000)
})
onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
})
</script>

<template>
  <ClientOnly>
    <UiToolShell title="TOTP 动态令牌" :error="error" :dual="false">
      <template #actions>
        <button type="button" class="btn" @click="refresh">刷新</button>
        <button type="button" class="btn btn-ghost" @click="importUri">解析 otpauth URI</button>
        <UiCopyButton :text="code" />
      </template>
      <div class="grid">
        <label class="lbl">密钥（Base32）或 otpauth://</label>
        <input v-model="secret" class="inp" placeholder="JBSWY3DPEHPK3PXP 或 otpauth://…" autocomplete="off" @change="refresh" />
        <div class="opts">
          <label>算法
            <select v-model="algo" class="sel" @change="refresh">
              <option value="SHA-1">SHA-1</option>
              <option value="SHA-256">SHA-256</option>
              <option value="SHA-512">SHA-512</option>
            </select>
          </label>
          <label>位数
            <select v-model.number="digits" class="sel" @change="refresh">
              <option :value="6">6</option>
              <option :value="8">8</option>
            </select>
          </label>
          <label>周期(秒)
            <input v-model.number="period" type="number" min="10" max="120" class="num" @change="refresh" />
          </label>
        </div>
        <div class="code">{{ display }}</div>
        <div class="prog">
          <div class="prog-bar" :style="{ width: (remain / period) * 100 + '%' }" />
          <span class="cd">{{ remain }}s</span>
        </div>
        <div class="verify">
          <input v-model="verifyInput" class="inp" placeholder="待校验 OTP…" />
          <button type="button" class="btn" @click="doVerify">校验 ±1 步</button>
          <span class="vmsg">{{ verifyMsg }}</span>
        </div>
      </div>
    </UiToolShell>
    <template #fallback>
      <p class="hint">TOTP 需在浏览器端使用 Web Crypto…</p>
    </template>
  </ClientOnly>
</template>

<style scoped>
.num { width: 64px; }
.opts .sel { width: auto; padding: 6px 10px; }
.code {
  font-size: 2rem;
  letter-spacing: 0.15em;
  color: var(--brand);
  font-weight: 600;
  font-family: var(--mono);
  margin: 8px 0;
}
.prog {
  position: relative;
  height: 8px;
  border-radius: 4px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  margin-bottom: 16px;
}
.prog-bar {
  height: 100%;
  background: var(--brand-strong);
  border-radius: 4px;
  transition: width 0.5s linear;
}
.cd {
  position: absolute;
  right: 0;
  top: -18px;
  font-size: 0.75rem;
  color: var(--text-muted);
}
.verify {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.vmsg { font-size: 0.85rem; color: var(--success); }
</style>
