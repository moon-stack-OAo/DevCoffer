<script setup lang="ts">
import { formatSpringBinding } from '#shared/generate/springbinding'

const { input, output, error, setOutput, setError, clearError } = useToolState('my.prop-name')

function doConvert() {
  clearError()
  try { setOutput(formatSpringBinding(input.value)) } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
watch(input, () => doConvert(), { immediate: true })
</script>

<template>
  <UiToolShell title="Spring 配置键转换" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doConvert">转换</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">relaxed binding：camel / kebab / snake / ENV 互转。</p>
    </template>
    <template #input>
      <label class="lbl">配置键</label>
      <textarea v-model="input" class="ta" rows="4" @change="doConvert" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>

