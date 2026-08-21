<script setup lang="ts">
import { javaPatternFromJs } from '#shared/text/regexjava'
const flags = ref('i')
const { input, output, error, setOutput, setError, clearError } = useToolState('\\d+')
function run() {
  clearError()
  try { setOutput(javaPatternFromJs(input.value, flags.value)) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="正则 → Java 代码" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">转换</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts"><label>JS flags <input v-model="flags" class="inp" placeholder="gimsu" /></label></div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="4" />
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="16" readonly />
    </template>
  </UiToolShell>
</template>
