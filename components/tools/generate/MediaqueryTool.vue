<script setup lang="ts">
import { mediaqueryBuild, mediaqueryPresets } from '#shared/generate/mediaquery'

const direction = ref<'min-width' | 'max-width'>('min-width')
const width = ref(768)
const orientation = ref<'' | 'portrait' | 'landscape'>('')
const body = ref('  /* styles */')
const { output, error, setOutput, setError, clearError } = useToolState()
const active = ref('md')

function render() {
  clearError()
  try {
    setOutput(mediaqueryBuild({ direction: direction.value, width: width.value, orientation: orientation.value, body: body.value }))
  } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
function applyPreset(id: string) {
  const p = mediaqueryPresets.find((x) => x.id === id)
  if (!p) return
  active.value = id
  width.value = p.width
}
watch([direction, width, orientation, body], () => render(), { immediate: true })
</script>

<template>
  <UiToolShell title="Media Query 生成" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="render">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="chips">
        <button v-for="p in mediaqueryPresets" :key="p.id" type="button" class="chip" :class="{ active: active === p.id }" @click="applyPreset(p.id)">{{ p.name }}</button>
      </div>
      <div class="opts">
        <label>宽度条件
          <select v-model="direction" class="sel">
            <option value="min-width">min-width</option>
            <option value="max-width">max-width</option>
          </select>
        </label>
        <label>宽度 <input v-model.number="width" type="number" class="inp" style="width:90px" /></label>
        <label>屏幕方向
          <select v-model="orientation" class="sel">
            <option value="">(无)</option>
            <option value="portrait">portrait</option>
            <option value="landscape">landscape</option>
          </select>
        </label>
      </div>
    </template>
    <template #input>
      <label class="lbl">规则体</label>
      <textarea v-model="body" class="ta" rows="6" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly />
    </template>
  </UiToolShell>
</template>
