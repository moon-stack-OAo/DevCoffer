<script setup lang="ts">
import { formatYaml, yamlToJson, jsonToYaml } from '#shared/format/yaml'

const SAMPLE = 'name: demo\nlist:\n  - a\n  - b\nmeta:\n  enabled: true'

const { input, output, error, setOutput, setError, clearError } = useToolState(SAMPLE)

function run(fn: () => string) {
  clearError()
  try {
    setOutput(fn())
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
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
</script>

<template>
  <UiToolShell title="YAML 格式化" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run(() => formatYaml(input))">格式化</button>
      <button type="button" class="btn" @click="run(() => yamlToJson(input))">→JSON</button>
      <button type="button" class="btn btn-ghost" @click="run(() => jsonToYaml(input))">JSON→YAML</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">依赖 js-yaml。</p>
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
