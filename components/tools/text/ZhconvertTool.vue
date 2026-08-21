<script setup lang="ts">
import { s2t, t2s } from '#shared/text/zhconvert'

const SAMPLE = '开放源代码软件，繁体亦可：軟體開發'

const { input, output, error, setOutput, setError, clearError } = useToolState()

function toTrad() {
  clearError()
  if (!input.value.trim()) {
    setError('请输入要转换的文本')
    return
  }
  setOutput(s2t(input.value))
}

function toSimp() {
  clearError()
  if (!input.value.trim()) {
    setError('请输入要转换的文本')
    return
  }
  setOutput(t2s(input.value))
}

function swap() {
  const a = input.value
  input.value = output.value
  output.value = a
  clearError()
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
  <UiToolShell title="中文繁简转换" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="toTrad">简→繁</button>
      <button type="button" class="btn" @click="toSimp">繁→简</button>
      <button type="button" class="btn btn-ghost" @click="swap">互换</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">常用字对照表（非 OpenCC 全量），生僻字可能不转换。</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" placeholder="简体或繁体文本…" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>
