<script setup lang="ts">
import { htmlToMd, mdToHtmlLite } from '#shared/text/htmlmd'
const mode = ref<'h2m'|'m2h'>('h2m')
const { input, output, error, setOutput, setError, clearError } = useToolState('<h1>Hi</h1><p>hello <b>world</b></p>')
function run() {
  clearError()
  try { setOutput(mode.value === 'h2m' ? htmlToMd(input.value) : mdToHtmlLite(input.value)) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="HTML ↔ Markdown" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">转换</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>方向<select v-model="mode" class="sel"><option value="h2m">HTML→MD</option><option value="m2h">MD→HTML</option></select></label>
      </div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" />
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="12" readonly />
    </template>
  </UiToolShell>
</template>
