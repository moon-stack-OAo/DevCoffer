<script setup lang="ts">
import { mermaidWrap } from '#shared/codegen/mermaid'
const { input, output, error, setOutput, setError, clearError } = useToolState('flowchart TD\n  A-->B')
const host = ref<HTMLElement | null>(null)
async function run() {
  clearError()
  try {
    const src = mermaidWrap(input.value)
    setOutput(src)
    if (!import.meta.client || !host.value) return
    host.value.innerHTML = ''
    const mermaid = (await import('mermaid')).default
    mermaid.initialize({ startOnLoad: false, theme: 'dark' })
    const id = 'mmd-' + Date.now()
    const { svg } = await mermaid.render(id, src)
    host.value.innerHTML = svg
  } catch (e) { setError(e instanceof Error ? e.message : '渲染失败（可复制到 mermaid.live）') }
}
onMounted(() => run())
</script>
<template>
  <UiToolShell title="Mermaid" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">预览</button>
      <UiCopyButton :text="output" />
      <a class="btn btn-ghost" href="https://mermaid.live" target="_blank" rel="noopener">mermaid.live</a>
    </template>
    <template #toolbar>
      <p class="hint">客户端动态加载 mermaid；失败时可复制源码到 mermaid.live</p>
    </template>
    <template #input>
      <label class="lbl">源码</label>
      <textarea v-model="input" class="ta" rows="12" />
    </template>
    <template #output>
      <label class="lbl">预览</label>
      <div ref="host" class="preview mermaid-host" />
    </template>
  </UiToolShell>
</template>
<style scoped>
.mermaid-host {
  min-height: 200px;
  overflow: auto;
  align-items: center;
}
.mermaid-host :deep(svg) {
  max-width: 100%;
  height: auto;
}
</style>
