<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        text: string
        label?: string
        disabled?: boolean
    }>(),
    {
        label: '复制',
        disabled: false,
    },
)

const { copied, copy } = useClipboard()

async function onClick() {
    if (props.disabled) return
    await copy(props.text)
}
</script>

<template>
  <button
    type="button"
    class="btn btn-ghost copy-btn"
    :disabled="disabled || !text"
    @click="onClick"
  >
    {{ copied ? '已复制' : label }}
  </button>
</template>

<style scoped>
.copy-btn {
  min-width: 64px;
}
</style>
