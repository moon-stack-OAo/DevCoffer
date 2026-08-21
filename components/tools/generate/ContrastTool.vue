<script setup lang="ts">
import { parseColor } from '#shared/generate/color'
import { contrastRatio } from '#shared/generate/contrast'
const fg = ref('#e2e8f0'), bg = ref('#0f172a')
const { output, error, setOutput, setError, clearError } = useToolState()
const fgHex = computed(() => { try { return parseColor(fg.value).hex } catch { return '#000000' } })
const bgHex = computed(() => { try { return parseColor(bg.value).hex } catch { return '#ffffff' } })
function run() {
  clearError()
  try {
    const r = contrastRatio(fg.value, bg.value)
    setOutput(r.summary)
  } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
function onPick(which: 'fg' | 'bg', e: Event) {
  const v = (e.target as HTMLInputElement).value
  if (which === 'fg') fg.value = v
  else bg.value = v
}
watch([fg, bg], () => run(), { immediate: true })
</script>
<template>
  <UiToolShell title="对比度检测" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">检测</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>前景
          <input :value="fgHex" type="color" @input="onPick('fg', $event)" />
          <input v-model="fg" class="inp" placeholder="#e2e8f0 / hsl()" />
        </label>
        <label>背景
          <input :value="bgHex" type="color" @input="onPick('bg', $event)" />
          <input v-model="bg" class="inp" placeholder="#0f172a / rgb()" />
        </label>
      </div>
    </template>
    <template #input>
      <label class="lbl">预览</label>
      <div class="preview" :style="{ background: bgHex, color: fgHex }">示例文字 The quick brown fox</div>
    </template>
    <template #output>
      <label class="lbl">WCAG</label>
      <textarea :value="output" class="ta" rows="8" readonly />
    </template>
  </UiToolShell>
</template>
<style scoped>
.preview {
  padding: 20px;
  font-size: 18px;
}
</style>
