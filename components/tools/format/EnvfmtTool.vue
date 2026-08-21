<script setup lang="ts">
import { formatEnv, validateEnv, ENV_SAMPLE } from '#shared/format/envfmt'

const { input, output, error, setOutput, setError, clearError } = useToolState(ENV_SAMPLE)
const sort = ref(true)
const removeEmpty = ref(false)

function doFormat() {
  clearError()
  try {
    setOutput(formatEnv(input.value, { sort: sort.value, removeEmpty: removeEmpty.value }))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function doValidate() {
  clearError()
  try {
    setOutput(validateEnv(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function loadSample() {
  input.value = ENV_SAMPLE
  clearError()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title=".env 格式化" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doFormat">格式化</button>
      <button type="button" class="btn btn-ghost" @click="doValidate">校验</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label class="opts-inline"><input v-model="sort" type="checkbox" /> 按 key 排序</label>
        <label class="opts-inline"><input v-model="removeEmpty" type="checkbox" /> 去掉空值</label>
      </div>
      <p class="hint">非法 key（含空格等）、缺 key 的 =value、重复 key 会报错；格式化遇致命错误抛错。</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" placeholder="KEY=value" spellcheck="false" />
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
.opts-inline input[type='checkbox'] {
  width: 15px;
  height: 15px;
  accent-color: var(--brand);
  cursor: pointer;
}
</style>
