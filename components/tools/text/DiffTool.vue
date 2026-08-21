<script setup lang="ts">
import { lineDiff } from '#shared/text/diff'
const left = ref('a\nb\nc')
const right = ref('a\nx\nc')
const { output, error, setOutput, setError, clearError } = useToolState()
const lines = computed(() => {
  if (!output.value || output.value === '(无差异)') return [] as Array<{ cls: string; text: string }>
  return output.value.split('\n').map((line) => {
    if (line.startsWith('+ ')) return { cls: 'diff-added', text: line }
    if (line.startsWith('- ')) return { cls: 'diff-removed', text: line }
    return { cls: '', text: line }
  })
})
function run() {
  clearError()
  try { setOutput(lineDiff(left.value, right.value)) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="文本对比" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">对比</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      <div class="grid2">
        <div>
          <label class="lbl">原文</label>
          <textarea v-model="left" class="ta" rows="12" />
        </div>
        <div>
          <label class="lbl">对照</label>
          <textarea v-model="right" class="ta" rows="12" />
        </div>
      </div>
    </template>
    <template #output>
      <label class="lbl">Diff（- 删除 / + 新增）</label>
      <div v-if="lines.length" class="diff-output">
        <div v-for="(row, i) in lines" :key="i" :class="row.cls">{{ row.text }}</div>
      </div>
      <textarea v-else :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>
