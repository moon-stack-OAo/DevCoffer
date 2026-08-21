<script setup lang="ts">
import { formatEmailTool } from '#shared/codegen/email'

const { input, output, error, setOutput, setError, clearError } = useToolState('Contact: alice@example.com, bob@test.org')

function run(mode: 'validate' | 'extract') {
  clearError()
  try { setOutput(formatEmailTool(input.value, mode)) } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>

<template>
  <UiToolShell title="邮箱校验 / 提取" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run('validate')">校验</button>
      <button type="button" class="btn btn-ghost" @click="run('extract')">提取</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="10" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="10" readonly />
    </template>
  </UiToolShell>
</template>

