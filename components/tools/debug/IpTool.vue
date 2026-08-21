<script setup lang="ts">
import { formatIpLookup } from '#shared/debug/ip'

const { input, output, error, setOutput, setError, clearError } = useToolState("192.168.1.10/24")

function run() {
  clearError()
  try {
    setOutput(formatIpLookup(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}
</script>

<template>
  <UiToolShell title="IPv4 / CIDR" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">执行</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">示例：192.168.1.10 或 10.0.0.1/24</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="4" />
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>

