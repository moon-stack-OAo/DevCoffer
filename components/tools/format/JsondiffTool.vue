<script setup lang="ts">
import {
  jsonDiff,
  JSONDIFF_SAMPLE_LEFT,
  JSONDIFF_SAMPLE_RIGHT,
} from '#shared/format/jsondiff'

const left = ref(JSONDIFF_SAMPLE_LEFT)
const right = ref(JSONDIFF_SAMPLE_RIGHT)
const output = ref('')
const error = ref('')
const ignoreOrder = ref(false)

function run() {
  error.value = ''
  const r = jsonDiff(left.value, right.value, { ignoreArrayOrder: ignoreOrder.value })
  if (!r.ok) {
    error.value = r.error || '对比失败'
    output.value = ''
  } else {
    output.value = r.text
  }
}

function loadSample() {
  left.value = JSONDIFF_SAMPLE_LEFT
  right.value = JSONDIFF_SAMPLE_RIGHT
  error.value = ''
  run()
}

function clearAll() {
  left.value = ''
  right.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="JSON Diff" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="run">对比</button>
      <label class="opts" style="margin:0">
        <input v-model="ignoreOrder" type="checkbox" /> 忽略数组顺序
      </label>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <div class="grid2">
      <div>
        <label class="lbl">左侧 (旧)</label>
        <textarea v-model="left" class="ta" rows="12" />
      </div>
      <div>
        <label class="lbl">右侧 (新)</label>
        <textarea v-model="right" class="ta" rows="12" />
      </div>
    </div>
    <label class="lbl" style="margin-top:12px">差异报告</label>
    <textarea :value="output" class="ta" rows="12" readonly placeholder="点击对比…" />
  </UiToolShell>
</template>
