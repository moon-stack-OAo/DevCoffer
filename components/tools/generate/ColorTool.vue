<script setup lang="ts">
import { formatColor, parseColor } from '#shared/generate/color'
const color = ref('#38bdf8')
const { output, error, setOutput, setError, clearError } = useToolState()
const preview = computed(() => { try { return parseColor(color.value).hex } catch { return '#000000' } })
function run() {
  clearError()
  try { setOutput(formatColor(parseColor(color.value))) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
function onPick(e: Event) {
  color.value = (e.target as HTMLInputElement).value
  run()
}
watch(color, () => run(), { immediate: true })
</script>
<template>
  <UiToolShell title="颜色转换" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">转换</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>颜色
          <input :value="preview" type="color" @input="onPick" />
          <input v-model="color" class="inp" placeholder="#38bdf8 / rgb() / hsl()" />
        </label>
        <span class="swatch" :style="{ background: preview }" />
      </div>
    </template>
    <template #input>
      <label class="lbl">预览</label>
      <div class="preview color-preview" :style="{ background: preview }" />
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="8" readonly />
    </template>
  </UiToolShell>
</template>
<style scoped>
.color-preview {
  min-height: 160px;
}
</style>
