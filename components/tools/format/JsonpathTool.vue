<script setup lang="ts">
import {
  runJsonPath,
  JSONPATH_SAMPLE_JSON,
  JSONPATH_SAMPLE_PATH,
} from '#shared/format/jsonpath'

const { input, output, error, setOutput, setError, clearError } = useToolState(JSONPATH_SAMPLE_JSON)
const path = ref(JSONPATH_SAMPLE_PATH)

function doRun() {
  clearError()
  try {
    setOutput(runJsonPath(input.value, path.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function loadSample() {
  input.value = JSONPATH_SAMPLE_JSON
  path.value = JSONPATH_SAMPLE_PATH
  clearError()
}

function clearAll() {
  input.value = ''
  path.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="JSONPath（子集）" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doRun">查询</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label class="opts-inline">路径 <input v-model="path" class="inp" style="min-width:220px" /></label>
      </div>
      <p class="hint">仅支持 $.a.b / $.arr[0] / $['k']；不支持的 $.. / * / 过滤器会明确报错。</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" spellcheck="false" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>

<style scoped>
.opts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
}
.opts-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--text-muted);
}
</style>
