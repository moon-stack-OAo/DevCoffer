<script setup lang="ts">
import { hasCtcTable, loadCtcTable, morseDecode, morseEncode } from '#shared/encode/morse'

const { input, output, error, setOutput, setError, clearError, reset } = useToolState()

const unicodeDots = ref(false)
const lowerCase = ref(false)
const chinese = ref(true)
const loading = ref(false)

async function ensureCtc(needChinese: boolean) {
  if (!needChinese || hasCtcTable()) return
  loading.value = true
  try {
    await loadCtcTable()
  } finally {
    loading.value = false
  }
}

async function doEncode() {
  clearError()
  try {
    await ensureCtc(chinese.value)
    setOutput(
      morseEncode(input.value, {
        chinese: chinese.value,
        dot: unicodeDots.value ? '·' : '.',
        dash: unicodeDots.value ? '−' : '-',
      }),
    )
  } catch (e) {
    setError(e instanceof Error ? e.message : '编码失败')
  }
}

async function doDecode() {
  clearError()
  try {
    await ensureCtc(chinese.value)
    setOutput(
      morseDecode(input.value, {
        chinese: chinese.value,
        lowerCase: lowerCase.value,
      }),
    )
  } catch (e) {
    setError(e instanceof Error ? e.message : '解码失败')
  }
}

function swap() {
  input.value = output.value
  output.value = ''
  clearError()
}
</script>

<template>
  <UiToolShell title="摩斯电码" :error="error">
    <template #actions>
      <button type="button" class="btn" :disabled="loading" @click="doEncode">编码</button>
      <button type="button" class="btn" :disabled="loading" @click="doDecode">解码</button>
      <button type="button" class="btn btn-ghost" @click="swap">结果→输入</button>
      <button type="button" class="btn btn-ghost" @click="reset">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">
        中文经「中文电码」：汉字 → 四位电报码 → 数字摩斯；CJK↔ASCII 边界插入软词界
        <code>//</code>。
      </p>
      <div class="opts">
        <label title="汉字经「中文电码」转四位数字后再编摩斯（大陆标准）">
          <input v-model="chinese" type="checkbox" /> 中文电码
        </label>
        <label><input v-model="unicodeDots" type="checkbox" /> 编码用 ·/−</label>
        <label><input v-model="lowerCase" type="checkbox" /> 解码小写</label>
        <span v-if="loading" class="hint">电码表加载中…</span>
      </div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" placeholder="输入…" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>
