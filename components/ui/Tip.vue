<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    text?: string
    block?: boolean
  }>(),
  {
    text: '',
    block: false,
  },
)

const open = ref(false)
const x = ref(0)
const y = ref(0)

const tipText = computed(() => String(props.text || '').trim())

function onEnter(e: MouseEvent) {
  if (!tipText.value) return
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  x.value = Math.min(Math.max(r.left + r.width / 2, 16), window.innerWidth - 16)
  y.value = Math.max(r.top - 8, 8)
  open.value = true
}

function onLeave() {
  open.value = false
}
</script>

<template>
  <span
    class="ui-tip-host"
    :class="{ 'ui-tip-host--block': block }"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <slot />
    <Teleport v-if="open && tipText" to="body">
      <div class="ui-tip" role="tooltip" :style="{ left: `${x}px`, top: `${y}px` }">
        {{ tipText }}
      </div>
    </Teleport>
  </span>
</template>

<style scoped>
.ui-tip-host {
  display: inline-flex;
  max-width: 100%;
  min-width: 0;
  vertical-align: top;
}
.ui-tip-host--block {
  display: block;
  width: 100%;
  height: 100%;
}
</style>

<style>
.ui-tip {
  position: fixed;
  z-index: 9999;
  transform: translate(-50%, -100%);
  max-width: min(320px, calc(100vw - 24px));
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.35);
  background: var(--bg-tip);
  color: #e2e8f0;
  font-size: 0.78rem;
  line-height: 1.45;
  box-shadow: var(--shadow);
  pointer-events: none;
  white-space: normal;
  word-break: break-word;
}
.ui-tip::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--bg-tip);
}
</style>
