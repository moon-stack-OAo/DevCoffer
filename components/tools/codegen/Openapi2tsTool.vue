<script setup lang="ts">
import {
  parseOpenApi,
  generateTsClient,
  O2T_SAMPLE,
} from '#shared/codegen/openapi2ts'

const { input, output, error, setOutput, setError, clearError } = useToolState()
const baseUrl = ref('')

function run() {
  clearError()
  const parsed = parseOpenApi(input.value)
  if (!parsed.ok) {
    setError(parsed.error)
    setOutput('')
    return
  }
  try {
    setOutput(generateTsClient(parsed.doc, { baseUrl: baseUrl.value.trim() }))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function loadSample() {
  input.value = O2T_SAMPLE
  if (!baseUrl.value.trim()) {
    baseUrl.value = 'https://petstore.example.com/api'
  }
  clearError()
  run()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="OpenAPI → TS Client" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label class="opts-inline">
          baseUrl（可选，覆盖 servers）
          <input
            v-model="baseUrl"
            class="inp"
            type="text"
            placeholder="https://api.example.com"
          />
        </label>
      </div>
      <p class="hint">
        支持 OpenAPI 3 / Swagger 2；JSON 与 YAML。从 components.schemas 生成
        interface，path + method 生成 fetch 异步 Client；函数名优先 operationId。
      </p>
    </template>
    <template #input>
      <label class="lbl">OpenAPI（JSON / YAML）</label>
      <textarea
        v-model="input"
        class="ta"
        rows="12"
        placeholder='{"openapi":"3.0.3","info":{"title":"API","version":"1.0.0"},"paths":{}}'
        spellcheck="false"
      />
    </template>
    <template #output>
      <label class="lbl">生成的 TypeScript Client</label>
      <textarea :value="output" class="ta" rows="14" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>

<style scoped>
.opts-inline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 0.82rem;
  color: var(--text-muted);
}
.opts-inline .inp {
  min-width: 260px;
  flex: 1;
}
</style>
