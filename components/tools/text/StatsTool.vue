<script setup lang="ts">
import { calcStats, formatStatsReport } from '#shared/text/stats'

const SAMPLE = `Hello 世界！
这是一行统计示例。
Count: 123`

const { input, output, error, setOutput, clearError } = useToolState()
const stats = computed(() => calcStats(input.value))

function report() {
  clearError()
  setOutput(formatStatsReport(input.value))
}

function loadSample() {
  input.value = SAMPLE
  clearError()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}

watch(input, () => report(), { immediate: true })
</script>

<template>
  <UiToolShell title="文本统计" :error="error" :dual="true">
    <template #actions>
      <button type="button" class="btn" @click="report">刷新</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" placeholder="粘贴文本…" />
    </template>
    <template #output>
      <div class="stats-grid" style="margin-bottom:12px">
        <div class="stat-card"><div class="n">{{ stats.chars }}</div><div class="k">字符</div></div>
        <div class="stat-card"><div class="n">{{ stats.charsNoSpace }}</div><div class="k">不含空白</div></div>
        <div class="stat-card"><div class="n">{{ stats.words }}</div><div class="k">词数</div></div>
        <div class="stat-card"><div class="n">{{ stats.lines }}</div><div class="k">行数</div></div>
        <div class="stat-card"><div class="n">{{ stats.bytes }}</div><div class="k">UTF-8 字节</div></div>
        <div class="stat-card"><div class="n">{{ stats.cjk }}</div><div class="k">CJK</div></div>
      </div>
      <label class="lbl">报告</label>
      <textarea :value="output" class="ta" rows="6" readonly />
    </template>
  </UiToolShell>
</template>
