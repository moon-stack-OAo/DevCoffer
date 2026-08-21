<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<template>
  <ToolsReferenceRefPanel
    tool-id="mimetype"
    :title="title || 'MIME / Content-Type'"
    hint="按类别浏览扩展名与 MIME 对照；支持关键词过滤。"
    placeholder="json / image/ / 文本…"
  />
</template>
