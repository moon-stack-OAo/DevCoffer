<script setup lang="ts">
import { jsonSortKeys, jsonWrapArray, jsonToYaml, yamlToJsonText } from '#shared/format/jsonconvert'

const SAMPLE = '{\n  "b": 2,\n  "a": 1,\n  "nested": { "z": 0, "y": 1 }\n}'

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
  <UiToolShell title="JSON 结构转换" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run(() => jsonSortKeys(input))">键排序</button>
      <button type="button" class="btn" @click="run(() => jsonWrapArray(input))">包数组</button>
      <button type="button" class="btn" @click="run(() => jsonToYaml(input))">→YAML</button>
      <button type="button" class="btn btn-ghost" @click="run(() => yamlToJsonText(input))">YAML→JSON</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">键排序 / 数组包装 / JSON↔YAML。</p>
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
