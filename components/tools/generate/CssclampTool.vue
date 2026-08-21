<script setup lang="ts">
import { cssclampCompute } from '#shared/generate/cssclamp'

const minFont = ref(16)
const maxFont = ref(32)
const minVw = ref(320)
const maxVw = ref(1280)
const copyText = ref('')
const { output, error, setOutput, setError, clearError } = useToolState()

function doCalc() {
  clearError()
  const r = cssclampCompute(minFont.value, maxFont.value, minVw.value, maxVw.value)
  if (!r.ok) {
    copyText.value = ''
    setError(r.msg || '失败')
    return
  }
  copyText.value = r.clamp || ''
  setOutput([r.clamp, '', 'preferred: ' + r.preferred, 'slope: ' + r.slope, 'yIntercept: ' + r.yIntercept].join('\n'))
}
watch([minFont, maxFont, minVw, maxVw], () => doCalc(), { immediate: true })
</script>

<template>
  <UiToolShell title="CSS clamp 计算器" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doCalc">计算</button>
      <UiCopyButton :text="copyText" />
    </template>
    <template #input>
      <div class="grid2">
        <label class="lbl">最小字号 px <input v-model.number="minFont" type="number" class="inp" style="width:100%" /></label>
        <label class="lbl">最大字号 px <input v-model.number="maxFont" type="number" class="inp" style="width:100%" /></label>
        <label class="lbl">最小视口 px <input v-model.number="minVw" type="number" class="inp" style="width:100%" /></label>
        <label class="lbl">最大视口 px <input v-model.number="maxVw" type="number" class="inp" style="width:100%" /></label>
      </div>
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="10" readonly />
    </template>
  </UiToolShell>
</template>
