<script setup lang="ts">
import { poolCalcEstimate } from '#shared/debug/poolcalc'
const qps = ref(200)
const avgMs = ref(50)
const cpuCores = ref(8)
const blockingRatio = ref(1)
const targetUtil = ref(0.7)
const queueSeconds = ref(1.5)
const { output, error, setOutput, setError, clearError } = useToolState()
function run() {
  clearError()
  try {
    setOutput(poolCalcEstimate({ qps: qps.value, avgMs: avgMs.value, cpuCores: cpuCores.value, blockingRatio: blockingRatio.value, targetUtil: targetUtil.value, queueSeconds: queueSeconds.value }))
  } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="线程池估算" :error="error" :dual="true">
    <template #actions>
      <button type="button" class="btn" @click="run">估算</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      <div class="grid2">
        <label class="lbl">QPS <input v-model.number="qps" type="number" class="inp" style="width:100%" /></label>
        <label class="lbl">平均耗时 ms <input v-model.number="avgMs" type="number" class="inp" style="width:100%" /></label>
        <label class="lbl">CPU 核数 <input v-model.number="cpuCores" type="number" class="inp" style="width:100%" /></label>
        <label class="lbl">阻塞比 <input v-model.number="blockingRatio" type="number" step="0.1" class="inp" style="width:100%" /></label>
        <label class="lbl">目标利用率 <input v-model.number="targetUtil" type="number" step="0.05" class="inp" style="width:100%" /></label>
        <label class="lbl">排队秒数 <input v-model.number="queueSeconds" type="number" step="0.1" class="inp" style="width:100%" /></label>
      </div>
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>
