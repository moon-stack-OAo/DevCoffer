<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<template>
  <ToolsReferenceRefPanel
    tool-id="httpstatus"
    :title="title || 'HTTP 状态码'"
    hint="按状态码区间或 HTTP 方法浏览；支持关键词过滤。"
    placeholder="404 / Not Found / GET…"
  />
</template>
