<script setup lang="ts">
const html = ref('<h1>Hello</h1><p>sandbox preview</p>')
const srcdoc = ref('')
const { error, clearError } = useToolState()

function run() {
    clearError()
    srcdoc.value = html.value
}
</script>
<template>
  <UiToolShell title="HTML 沙箱预览" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">预览</button>
    </template>
    <template #toolbar>
      <p class="hint">iframe sandbox（allow-scripts）；勿运行不可信 HTML</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="html" class="ta" rows="12" />
    </template>
    <template #output>
      <iframe class="run" sandbox="allow-scripts" :srcdoc="srcdoc" title="html-run" />
    </template>
  </UiToolShell>
</template>
