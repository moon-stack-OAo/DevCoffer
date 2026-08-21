<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        /** Bootstrap Icons 名：bi-braces / braces */
        name?: string | null
        size?: 'sm' | 'md' | 'lg'
    }>(),
    {
        name: '',
        size: 'md',
    },
)

const glyph = computed(() => {
    const raw = (props.name || '').trim()
    if (!raw) return 'tools'
    return raw.replace(/^bi\s+/, '').replace(/^bi-/, '')
})

const src = computed(() => `/icons/${glyph.value}.svg`)
</script>

<template>
  <span class="tool-icon" :class="`is-${size}`" aria-hidden="true">
    <img :src="src" :alt="''" width="16" height="16" loading="lazy" decoding="async">
  </span>
</template>

<style scoped>
.tool-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 0;
  color: #7dd3fc;
}
.tool-icon img {
  display: block;
  width: 1em;
  height: 1em;
  /* 将黑色 SVG 染成品牌色 */
  filter: invert(79%) sepia(28%) saturate(749%) hue-rotate(162deg) brightness(101%) contrast(96%);
}
.tool-icon.is-sm {
  font-size: 0.95rem;
}
.tool-icon.is-md {
  font-size: 1.15rem;
}
.tool-icon.is-lg {
  font-size: 1.4rem;
}
</style>
