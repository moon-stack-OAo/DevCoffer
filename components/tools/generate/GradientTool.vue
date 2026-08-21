<script setup lang="ts">
import { linearGradient, radialGradient } from '#shared/generate/gradient'
const angle = ref(135), c1 = ref('#0ea5e9'), c2 = ref('#a855f7'), c3 = ref(''), kind = ref<'linear'|'radial'>('linear')
const { output, error, setOutput, clearError } = useToolState()
function run() {
  clearError()
  setOutput(kind.value === 'linear' ? linearGradient(angle.value, c1.value, c2.value, c3.value || undefined) : radialGradient(c1.value, c2.value))
}
watch([angle, c1, c2, c3, kind], () => run(), { immediate: true })
</script>
<template>
  <UiToolShell title="渐变生成" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>类型
          <select v-model="kind" class="sel">
            <option value="linear">linear</option>
            <option value="radial">radial</option>
          </select>
        </label>
        <label v-if="kind === 'linear'">角度 <input v-model.number="angle" type="number" class="num" /></label>
        <label>色标1 <input v-model="c1" type="color" /></label>
        <label>色标2 <input v-model="c2" type="color" /></label>
        <label v-if="kind === 'linear'">色标3可选 <input v-model="c3" class="inp" placeholder="#fff" /></label>
      </div>
    </template>
    <template #input>
      <label class="lbl">预览</label>
      <div class="preview" :style="output" />
    </template>
    <template #output>
      <label class="lbl">CSS</label>
      <textarea :value="output" class="ta" rows="8" readonly />
    </template>
  </UiToolShell>
</template>
