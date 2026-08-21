<script setup lang="ts">
import { parseNginxLogMulti, summarizeNginxLogText } from '#shared/debug/nginxlog'

const mode = ref<'parse' | 'summary'>('parse')
const statusFilter = ref('')
const methodFilter = ref('')
const keyword = ref('')
const { input, output, error, setOutput, setError, clearError } = useToolState(
  '1.2.3.4 - - [19/Aug/2026:10:00:00 +0800] "GET /api HTTP/1.1" 200 123 "-" "Mozilla/5.0"\n1.2.3.5 - - [19/Aug/2026:10:00:01 +0800] "POST /api HTTP/1.1" 500 10 "-" "curl/8.0"',
)

function buildFilter() {
  const st = statusFilter.value.trim()
  let statusMin: number | null = null
  let statusMax: number | null = null
  if (st) {
    // 支持 500 / 5xx / 400-499
    const range = st.match(/^(\d{3})\s*-\s*(\d{3})$/)
    const group = st.match(/^([1-5])xx$/i)
    if (range) {
      statusMin = parseInt(range[1]!, 10)
      statusMax = parseInt(range[2]!, 10)
    } else if (group) {
      const n = parseInt(group[1]!, 10)
      statusMin = n * 100
      statusMax = n * 100 + 99
    } else {
      const n = parseInt(st, 10)
      if (!isNaN(n)) {
        statusMin = n
        statusMax = n
      }
    }
  }
  return {
    statusMin,
    statusMax,
    method: methodFilter.value.trim(),
    pathContains: keyword.value.trim(),
  }
}

function run() {
  clearError()
  try {
    const opts = buildFilter()
    setOutput(mode.value === 'summary' ? summarizeNginxLogText(input.value, opts) : parseNginxLogMulti(input.value, opts))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}
</script>

<template>
  <UiToolShell title="Nginx 日志解析" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">执行</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label><input v-model="mode" type="radio" value="parse" /> 逐行解析</label>
        <label><input v-model="mode" type="radio" value="summary" /> 汇总统计</label>
        <label>status <input v-model="statusFilter" class="inp" style="width:90px" placeholder="500 / 5xx" /></label>
        <label>method
          <select v-model="methodFilter" class="sel">
            <option value="">全部</option>
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
            <option>PATCH</option>
            <option>HEAD</option>
            <option>OPTIONS</option>
          </select>
        </label>
        <label>path/keyword <input v-model="keyword" class="inp" style="width:120px" placeholder="/api" /></label>
      </div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="8" />
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>
