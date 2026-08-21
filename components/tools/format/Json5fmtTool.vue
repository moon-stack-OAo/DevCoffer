<script setup lang="ts">
import { formatJson5, toStrictJson } from '#shared/format/json5fmt'

const SAMPLE = [
  '{',
  '  // 用户配置',
  "  name: 'DevCoffer',",
  '  version: "1.0.0",',
  '  features: [',
  '    "json5",',
  '    "jsonc", /* trailing comma ok */',
  '  ],',
  '  nested: {',
  '    enabled: true,',
  '    count: 3,',
  '  },',
  '}',
].join('\n')

const { input, output, error, setOutput, setError, clearError } = useToolState(SAMPLE)
const indent = ref(2)
const pretty = ref(true)

function doFormat() {
  clearError()
  try {
    setOutput(formatJson5(input.value, indent.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function doStrict() {
  clearError()
  try {
    setOutput(toStrictJson(input.value, pretty.value, indent.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function doMin() {
  clearError()
  try {
    setOutput(toStrictJson(input.value, false))
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
  <UiToolShell title="JSON5 / JSONC 格式化" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doFormat">格式化</button>
      <button type="button" class="btn" @click="doStrict">转标准 JSON</button>
      <button type="button" class="btn btn-ghost" @click="doMin">压缩</button>
      <label class="opts-inline">
        缩进
        <select v-model.number="indent" class="sel">
          <option :value="2">2</option>
          <option :value="4">4</option>
        </select>
      </label>
      <label class="opts-inline">
        <input v-model="pretty" type="checkbox" /> 美化输出
      </label>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">支持去注释、尾逗号、单引号、无引号 key（简化子集）。</p>
    </template>
    <template #input>
      <label class="lbl">输入 JSON5 / JSONC</label>
      <textarea
        v-model="input"
        class="ta"
        rows="12"
        placeholder="{&#10;  // comment&#10;  name: 'demo',&#10;  list: [1, 2,],&#10;}"
      />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>

<style scoped>
.opts-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--text-muted);
}
.opts-inline .sel {
  width: auto;
  min-width: 70px;
}
.opts-inline input[type='checkbox'] {
  width: 15px;
  height: 15px;
  accent-color: var(--brand);
  cursor: pointer;
}
</style>
