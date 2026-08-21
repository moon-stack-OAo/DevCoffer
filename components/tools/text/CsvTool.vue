<script setup lang="ts">
import { csvToJson, csvToHtmlTable, formatCsvAlign } from '#shared/text/csv'

const { input, output, error, setOutput, setError, clearError } = useToolState('name,age,city\nAlice,30,Beijing\nBob,25,Shanghai')
const delim = ref(',')
const hasHeader = ref(true)

function run(fn: () => string) {
  clearError()
  try { setOutput(fn()) } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>

<template>
  <UiToolShell title="CSV 格式化" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run(() => csvToJson(input, delim, hasHeader))">→JSON</button>
      <button type="button" class="btn" @click="run(() => csvToHtmlTable(input, delim, hasHeader))">→HTML</button>
      <button type="button" class="btn btn-ghost" @click="run(() => formatCsvAlign(input, delim))">对齐</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>分隔符
          <select v-model="delim" class="sel">
            <option value=",">逗号</option>
            <option value="\t">Tab</option>
            <option value=";">分号</option>
          </select>
        </label>
        <label><input v-model="hasHeader" type="checkbox" /> 首行表头</label>
      </div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>

