<script setup lang="ts">
import { ddlToMermaidEr } from '#shared/codegen/mermaid'
const { input, output, error, setOutput, setError, clearError } = useToolState('CREATE TABLE user (id INT, name VARCHAR(50));')
const host = ref<HTMLElement | null>(null)
async function run() {
  clearError()
  try {
    const src = ddlToMermaidEr(input.value)
    setOutput(src)
    if (!import.meta.client || !host.value) return
    host.value.innerHTML = ''
    const mermaid = (await import('mermaid')).default
    mermaid.initialize({ startOnLoad: false, theme: 'dark' })
    const { svg } = await mermaid.render('er-' + Date.now(), src)
    host.value.innerHTML = svg
  } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="DDL → Mermaid ER" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="10" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="10" readonly />
      <div ref="host" class="preview" />
    </template>
  </UiToolShell>
</template>
