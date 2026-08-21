<script setup lang="ts">
import { toMdTable, beautifyMdTable, mdTableToCsv } from '#shared/text/mdtable'

const { input, output, error, setOutput, setError, clearError } = useToolState('name,age\nAlice,30\nBob,25')
const align = ref('left')

function run(fn: () => string) {
  clearError()
  try { setOutput(fn()) } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>

<template>
  <UiToolShell title="Markdown 表格" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run(() => toMdTable(input, { align }))">→MD 表</button>
      <button type="button" class="btn" @click="run(() => beautifyMdTable(input))">美化 MD</button>
      <button type="button" class="btn btn-ghost" @click="run(() => mdTableToCsv(input))">MD→CSV</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>对齐
          <select v-model="align" class="sel">
            <option value="left">左</option>
            <option value="center">中</option>
            <option value="right">右</option>
          </select>
        </label>
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

