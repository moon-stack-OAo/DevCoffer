<script setup lang="ts">
import { sqlExplainHints, SQLEXPLAIN_SAMPLE } from '#shared/format/sqlexplain'

const { input, output, error, setOutput, setError, clearError } = useToolState(SQLEXPLAIN_SAMPLE)

function run() {
  clearError()
  try {
    setOutput(sqlExplainHints(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function loadSample() {
  input.value = SQLEXPLAIN_SAMPLE
  clearError()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}

onMounted(() => run())
</script>

<template>
  <UiToolShell title="SQL 计划启发式" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">分析</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">非真实 EXPLAIN；非 SQL 会报错，像 SQL 但无风险才提示「未命中」。</p>
    </template>
    <template #input>
      <label class="lbl">SQL</label>
      <textarea v-model="input" class="ta" rows="12" placeholder="SELECT …" spellcheck="false" />
    </template>
    <template #output>
      <label class="lbl">说明</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="分析结果…" />
    </template>
  </UiToolShell>
</template>
