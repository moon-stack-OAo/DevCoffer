<script setup lang="ts">
import {
  formatProperties,
  validateProperties,
  PROPERTIES_SAMPLE,
} from '#shared/format/propertiesfmt'

const { input, output, error, setOutput, setError, clearError } = useToolState(PROPERTIES_SAMPLE)
const sort = ref(false)
const useUnicode = ref(false)

function doFormat() {
  clearError()
  try {
    setOutput(formatProperties(input.value, { sort: sort.value, useUnicode: useUnicode.value }))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function doValidate() {
  clearError()
  try {
    setOutput(validateProperties(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function loadSample() {
  input.value = PROPERTIES_SAMPLE
  clearError()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="Properties 格式化" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doFormat">格式化</button>
      <button type="button" class="btn btn-ghost" @click="doValidate">校验</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label class="opts-inline"><input v-model="sort" type="checkbox" /> 排序</label>
        <label class="opts-inline"><input v-model="useUnicode" type="checkbox" /> Unicode 转义</label>
      </div>
      <p class="hint">无 =/:、空 key、重复 key、异常转义会报错；校验通过时输出统计。</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" placeholder="key=value" spellcheck="false" />
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
