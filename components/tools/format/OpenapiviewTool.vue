<script setup lang="ts">
import { openApiSummary, OPENAPIVIEW_SAMPLE } from '#shared/format/openapiview'

const { input, output, error, setOutput, setError, clearError } = useToolState(OPENAPIVIEW_SAMPLE)

function run() {
  clearError()
  try {
    setOutput(openApiSummary(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function loadSample() {
  input.value = OPENAPIVIEW_SAMPLE
  clearError()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="OpenAPI 预览" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">预览</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">
        支持 JSON / YAML；输出为结构化摘要预览（info / servers / paths /
        schemas），非 Swagger UI。
      </p>
    </template>
    <template #input>
      <label class="lbl">输入 OpenAPI（JSON / YAML）</label>
      <textarea
        v-model="input"
        class="ta"
        rows="14"
        placeholder="openapi: 3.0.0 …"
        spellcheck="false"
      />
    </template>
    <template #output>
      <label class="lbl">摘要预览</label>
      <textarea :value="output" class="ta" rows="14" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>
