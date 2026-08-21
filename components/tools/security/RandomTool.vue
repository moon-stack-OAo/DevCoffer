<script setup lang="ts">
import { generateHexToken, generatePassword, generatePin } from '#shared/security/random'

const len = ref(16)
const upper = ref(true)
const lower = ref(true)
const digit = ref(true)
const special = ref(false)
const { output, error, setOutput, setError, clearError } = useToolState()

function doPassword() {
  clearError()
  try {
    setOutput(generatePassword(len.value, {
      upper: upper.value,
      lower: lower.value,
      digit: digit.value,
      special: special.value,
    }))
  } catch (e) {
    setError(e instanceof Error ? e.message : '生成失败')
  }
}
function doToken() {
  clearError()
  try { setOutput(generateHexToken(Math.ceil(len.value / 2))) }
  catch (e) { setError(e instanceof Error ? e.message : '生成失败') }
}
function doPin() {
  clearError()
  try { setOutput(generatePin(Math.min(len.value, 12))) }
  catch (e) { setError(e instanceof Error ? e.message : '生成失败') }
}
onMounted(() => doPassword())
</script>

<template>
  <UiToolShell title="随机生成器" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="doPassword">密码</button>
      <button type="button" class="btn" @click="doToken">Hex Token</button>
      <button type="button" class="btn btn-ghost" @click="doPin">PIN</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>长度 <input v-model.number="len" type="number" min="4" max="256" class="num" /></label>
        <label><input v-model="upper" type="checkbox" /> 大写</label>
        <label><input v-model="lower" type="checkbox" /> 小写</label>
        <label><input v-model="digit" type="checkbox" /> 数字</label>
        <label><input v-model="special" type="checkbox" /> 特殊字符</label>
      </div>
    </template>
    <label class="lbl">结果</label>
    <textarea :value="output" class="ta" rows="14" readonly placeholder="点击生成…" />
  </UiToolShell>
</template>
