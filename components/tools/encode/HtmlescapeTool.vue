<script setup lang="ts">
import { htmlEscape, htmlUnescape } from '#shared/encode/htmlescape'

const { input, output, error, setOutput, setError, clearError, reset } = useToolState()


function doEncode() {
  clearError()
  try {
    setOutput(htmlEscape(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '转义失败')
  }
}

function doDecode() {
  clearError()
  try {
    setOutput(htmlUnescape(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '反转义失败')
  }
}

function swap() {
  input.value = output.value
  output.value = ''
  clearError()
}
</script>

<template>
  <UiToolShell title="HTML 实体转义" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doEncode">转义</button>
      <button type="button" class="btn" @click="doDecode">反转义</button>
      
      <button type="button" class="btn btn-ghost" @click="swap">结果→输入</button>
      <button type="button" class="btn btn-ghost" @click="reset">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" placeholder="HTML 文本…" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>

