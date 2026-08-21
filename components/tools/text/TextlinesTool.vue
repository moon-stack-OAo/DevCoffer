<script setup lang="ts">
import { processTextLines } from '#shared/text/textlines'

const SAMPLE = ` banana
Apple
apple
10
2
`

const { input, output, error, setOutput, setError, clearError } = useToolState()
const trim = ref(false)
const removeEmpty = ref(false)
const caseInsensitive = ref(false)
const numeric = ref(false)

function baseOpts() {
  return {
    trim: trim.value,
    removeEmpty: removeEmpty.value,
    caseInsensitive: caseInsensitive.value,
    numeric: numeric.value,
  }
}

function run(extra: Record<string, unknown>) {
  clearError()
  try {
    if (!input.value.trim()) throw new Error('请输入文本')
    setOutput(processTextLines(input.value, { ...baseOpts(), ...extra }))
  } catch (e) {
    setError(e instanceof Error ? e.message : '处理失败')
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
  <UiToolShell title="文本行处理" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run({ sort: true, order: 'asc' })">升序</button>
      <button type="button" class="btn" @click="run({ sort: true, order: 'desc' })">降序</button>
      <button type="button" class="btn" @click="run({ unique: true })">去重</button>
      <button type="button" class="btn" @click="run({ reverse: true })">反转</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">勾选选项后点「应用选项」或主操作；次要操作见下方按钮。</p>
      <div class="opts">
        <label><input v-model="trim" type="checkbox" /> Trim</label>
        <label><input v-model="removeEmpty" type="checkbox" /> 去空行</label>
        <label><input v-model="caseInsensitive" type="checkbox" /> 忽略大小写</label>
        <label><input v-model="numeric" type="checkbox" /> 数字排序</label>
        <button type="button" class="btn btn-ghost" @click="run({})">应用选项</button>
        <button type="button" class="btn btn-ghost" @click="run({ shuffle: true })">打乱</button>
        <button type="button" class="btn btn-ghost" @click="run({ addNumbers: true })">加行号</button>
        <button type="button" class="btn btn-ghost" @click="run({ removeNumbers: true })">去行号</button>
      </div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" placeholder="每行一项…" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>
