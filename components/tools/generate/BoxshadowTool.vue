<script setup lang="ts">
import { boxShadowCss } from '#shared/generate/boxshadow'
const x = ref(0), y = ref(8), blur = ref(16), spread = ref(0), color = ref('#000000'), inset = ref(false)
const colorAlpha = ref(0.35)
const { output, error, setOutput, clearError } = useToolState()
const shadowColor = computed(() => {
  const hex = color.value.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16) || 0
  const g = parseInt(hex.slice(2, 4), 16) || 0
  const b = parseInt(hex.slice(4, 6), 16) || 0
  return `rgba(${r},${g},${b},${colorAlpha.value})`
})
const previewShadow = computed(() => {
  const parts = [inset.value ? 'inset' : '', `${x.value}px`, `${y.value}px`, `${blur.value}px`, `${spread.value}px`, shadowColor.value].filter(Boolean)
  return parts.join(' ')
})
function run() {
  clearError()
  setOutput(boxShadowCss({ x: x.value, y: y.value, blur: blur.value, spread: spread.value, color: shadowColor.value, inset: inset.value }))
}
watch([x, y, blur, spread, color, colorAlpha, inset], run, { immediate: true })
</script>
<template>
  <UiToolShell title="阴影生成器" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>X <input v-model.number="x" type="number" class="num" /></label>
        <label>Y <input v-model.number="y" type="number" class="num" /></label>
        <label>Blur <input v-model.number="blur" type="number" class="num" /></label>
        <label>Spread <input v-model.number="spread" type="number" class="num" /></label>
        <label>颜色 <input v-model="color" type="color" /> <input v-model="color" class="inp" /></label>
        <label>透明度 <input v-model.number="colorAlpha" type="number" min="0" max="1" step="0.05" class="num" /></label>
        <label><input v-model="inset" type="checkbox" /> inset</label>
      </div>
    </template>
    <template #input>
      <label class="lbl">预览</label>
      <div class="preview"><div class="box" :style="{ boxShadow: previewShadow }" /></div>
    </template>
    <template #output>
      <label class="lbl">CSS</label>
      <textarea :value="output" class="ta" rows="8" readonly />
    </template>
  </UiToolShell>
</template>
<style scoped>
.box {
  width: 140px;
  height: 90px;
  background: var(--brand);
  border-radius: var(--radius-sm);
  margin: 8px auto;
}
</style>
