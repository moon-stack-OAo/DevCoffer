<script setup lang="ts">
import { buildB3, buildTraceparent, formatTraceGenerate, parseTraceHeaders } from '#shared/debug/traceheader'

const mode = ref<'parse' | 'gen'>('parse')
const sampled = ref(true)
const { input, output, error, setOutput, setError, clearError } = useToolState(
  '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
)

function runParse() {
  clearError()
  try {
    setOutput(parseTraceHeaders(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function runGen() {
  clearError()
  try {
    const text = formatTraceGenerate(sampled.value)
    // 同步一份到输入，方便再解析
    input.value = buildTraceparent({ sampled: sampled.value })
    setOutput(text + '\n\n--- 也可复制 B3 ---\n' + buildB3({ sampled: sampled.value }).headersText)
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function run() {
  if (mode.value === 'parse') runParse()
  else runGen()
}
</script>

<template>
  <UiToolShell title="Trace Header" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">执行</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label><input v-model="mode" type="radio" value="parse" /> 解析</label>
        <label><input v-model="mode" type="radio" value="gen" /> 生成</label>
        <label v-if="mode === 'gen'"><input v-model="sampled" type="checkbox" /> sampled</label>
      </div>
    </template>
    <template #input>
      <label class="lbl">{{ mode === 'parse' ? 'traceparent / b3 / 多头' : '（生成后可回填到此再解析）' }}</label>
      <textarea v-model="input" class="ta" rows="6" />
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>
