<script setup lang="ts">
import { cssUnitConvert } from '#shared/generate/cssunit'
const value = ref(16)
const unit = ref('px')
const rootPx = ref(16)
const { output, error, setOutput, setError, clearError } = useToolState()
function run() {
  clearError()
  try {
    const r = cssUnitConvert(value.value, unit.value, rootPx.value)
    setOutput(Object.entries(r).map(([k,v]) => k + ': ' + v).join('\n'))
  } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
watch([value, unit, rootPx], run)
onMounted(() => run())
</script>
<template>
  <UiToolShell title="CSS 单位换算" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="run">换算</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>值 <input v-model.number="value" type="number" class="num" /></label>
        <label>单位
          <select v-model="unit" class="sel">
            <option>px</option><option>rem</option><option>em</option><option>pt</option><option>pc</option><option>%</option><option>in</option><option>cm</option><option>mm</option>
          </select>
        </label>
        <label>根字号 px <input v-model.number="rootPx" type="number" class="num" /></label>
      </div>
      <p class="hint">em 按根字号近似，当前与 rem 等价；% 相对根字号。</p>
    </template>
    <label class="lbl">结果</label>
    <textarea :value="output" class="ta" rows="12" readonly />
  </UiToolShell>
</template>
