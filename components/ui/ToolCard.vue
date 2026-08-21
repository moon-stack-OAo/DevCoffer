<script setup lang="ts">
defineProps<{
  id: string
  name: string
  desc?: string
  icon?: string
}>()
</script>

<template>
  <UiTip :text="desc || name" block>
    <NuxtLink :to="`/t/${id}`" class="tool-card">
      <div class="tool-card__head">
        <span class="tool-card__badge">
          <UiToolIcon :name="icon" />
        </span>
        <span class="tool-name">{{ name }}</span>
      </div>
      <span v-if="desc" class="tool-desc">{{ desc }}</span>
    </NuxtLink>
  </UiTip>
</template>
