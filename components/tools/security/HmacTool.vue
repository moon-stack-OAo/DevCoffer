<script setup lang="ts">
import { hmacSign, type HmacAlgo, type HmacFormat } from '#shared/security/hmac'

const { input, output, error, setOutput, setError, clearError } = useToolState()
const key = ref('')
const algo = ref<HmacAlgo>('SHA256')
const fmt = ref<HmacFormat>('hex')
const busy = ref(false)

async function compute() {
    clearError()
    if (!key.value) {
        setError('请输入密钥')
        return
    }
    if (!input.value) {
        setError('请输入待签名内容')
        return
    }
    busy.value = true
    try {
        setOutput(await hmacSign(key.value, input.value, algo.value, fmt.value))
    } catch (e) {
        setError(e instanceof Error ? e.message : '计算失败')
    } finally {
        busy.value = false
    }
}
</script>

<template>
  <UiToolShell title="HMAC 计算" :error="error">
    <template #actions>
      <button type="button" class="btn" :disabled="busy" @click="compute">计算</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>算法
          <select v-model="algo" class="sel">
            <option value="MD5">HMAC-MD5</option>
            <option value="SHA1">HMAC-SHA1</option>
            <option value="SHA256">HMAC-SHA256</option>
            <option value="SHA384">HMAC-SHA384</option>
            <option value="SHA512">HMAC-SHA512</option>
          </select>
        </label>
        <label>格式
          <select v-model="fmt" class="sel">
            <option value="hex">hex</option>
            <option value="base64">base64</option>
          </select>
        </label>
      </div>
    </template>
    <template #input>
      <label class="lbl">密钥</label>
      <input v-model="key" class="inp" placeholder="HMAC key…" />
      <label class="lbl" style="margin-top:10px">消息</label>
      <textarea v-model="input" class="ta" rows="10" placeholder="待签名内容…" />
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="HMAC…" />
    </template>
  </UiToolShell>
</template>
