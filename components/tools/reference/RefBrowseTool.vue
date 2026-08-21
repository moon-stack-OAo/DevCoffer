<script setup lang="ts">
const props = defineProps<{ toolId?: string; title?: string }>()
const route = useRoute()
const { toolsById } = useToolsRegistry()
const resolvedId = computed(() => props.toolId || String(route.params.id || ''))
const resolvedTitle = computed(
  () => props.title || toolsById[resolvedId.value]?.name || '参考速查',
)
</script>

<template>
  <ToolsReferenceRefPanel
    :tool-id="resolvedId"
    :title="resolvedTitle"
    hint="左侧选择条目，右侧查看详情与代码。支持关键词过滤。"
    placeholder="搜索名称 / 描述 / 示例…"
  />
</template>
