<script setup lang="ts">
import { tomlFormat, tomlParseLite, TOML_SAMPLE } from '#shared/format/toml'

const mode = ref<'fmt' | 'json'>('fmt')
const { input, output, error, setOutput, setError, clearError } = useToolState(TOML_SAMPLE)

function run() {
  clearError()
  try {
    if (!String(input.value || '').trim()) {
      setError('请输入 TOML')
      return
    }
    if (mode.value === 'fmt') setOutput(tomlFormat(input.value))
    else setOutput(JSON.stringify(tomlParseLite(input.value), null, 2))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function loadSample() {
  input.value = TOML_SAMPLE
  clearError()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="TOML 格式化（极简）" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">执行</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">仅顶层 key=value；含 [table] 时会明确报错，禁止静默丢弃。</p>
      <div class="opts">
        <label>
          模式
          <select v-model="mode" class="sel">
            <option value="fmt">格式化</option>
            <option value="json">→JSON</option>
          </select>
        </label>
      </div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea
        v-model="input"
        class="ta"
        rows="12"
        placeholder='name = "demo"'
        spellcheck="false"
      />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>
