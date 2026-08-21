<script setup lang="ts">
import { extractMybatisSql } from '#shared/debug/mybatissqllog'

const { input, output, error, setOutput, setError, clearError } = useToolState("Preparing: SELECT * FROM user WHERE id=?\nParameters: 1(Long)")

function run() {
  clearError()
  try {
    setOutput(extractMybatisSql(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}
</script>

<template>
  <UiToolShell title="MyBatis SQL 日志" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">执行</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="8" />
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>

