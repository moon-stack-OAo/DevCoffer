<script setup lang="ts">
import { parseUrl } from '#shared/debug/urlparser'

const { input, output, error, setOutput, setError, clearError } = useToolState(
  'https://user:pass@example.com:8080/path/to?a=1&b=hello%20world&c=3#section-2',
)

function doParse() {
  clearError()
  try { setOutput(parseUrl(input.value)) } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>

<template>
  <UiToolShell title="URL 解析" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doParse">解析</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      <label class="lbl">URL</label>
      <textarea v-model="input" class="ta" rows="6" />
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>

