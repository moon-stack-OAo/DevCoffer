<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

const { input, error, setError, clearError } = useToolState('# Hello\n\n**bold** and `code`')
const html = ref('')
let timer: ReturnType<typeof setTimeout> | null = null

function render() {
  clearError()
  try {
    const raw = marked.parse(input.value, { async: false }) as string
    html.value = DOMPurify.sanitize(raw, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    })
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function scheduleRender() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(render, 280)
}

function exportHtml() {
  if (!html.value) return
  const blob = new Blob([html.value], { type: 'text/html;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'preview.html'
  a.click()
  URL.revokeObjectURL(a.href)
}

watch(input, scheduleRender)
onMounted(render)
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <UiToolShell title="Markdown 预览" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="render">渲染</button>
      <UiCopyButton :text="html" label="复制 HTML" />
      <button type="button" class="btn btn-ghost" :disabled="!html" @click="exportHtml">导出 HTML</button>
    </template>
    <template #toolbar>
      <p class="hint">输入自动预览（防抖）；输出经 DOMPurify 消毒后再渲染。</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="14" />
    </template>
    <template #output>
      <label class="lbl">预览</label>
      <div class="md" v-html="html" />
    </template>
  </UiToolShell>
</template>

<style scoped>
.md {
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text);
  min-height: 200px;
  overflow: auto;
}
.md :deep(a) { color: var(--brand); }
.md :deep(code) {
  background: var(--bg-soft);
  padding: 1px 4px;
  border-radius: 3px;
}
.md :deep(pre) {
  background: var(--bg-soft);
  padding: 10px;
  overflow: auto;
}
</style>
