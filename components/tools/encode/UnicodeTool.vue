<script setup lang="ts">
import { decodeUnicode, encodeUnicode } from '#shared/encode/unicode'

const { input, output, error, setOutput, setError, clearError, reset } = useToolState()


function doEncode() {
  clearError()
  try {
    setOutput(encodeUnicode(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '编码失败')
  }
}

function doDecode() {
  clearError()
  try {
    setOutput(decodeUnicode(input.value))
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
  <UiToolShell title="Unicode \uXXXX 编解码" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doEncode">编码</button>
      <button type="button" class="btn" @click="doDecode">解码</button>
      
      <button type="button" class="btn btn-ghost" @click="swap">结果→输入</button>
      <button type="button" class="btn btn-ghost" @click="reset">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" placeholder="文本或 \uXXXX…" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>

