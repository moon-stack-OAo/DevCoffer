<script setup lang="ts">
import { formatIdValidate } from '#shared/generate/idvalidate'

const { input, output, error, setOutput, setError, clearError } = useToolState()

function run() {
    clearError()
    try {
        setOutput(formatIdValidate(input.value))
    } catch (e) {
        setError(e instanceof Error ? e.message : '校验失败')
    }
}

function loadSample() {
    input.value = '110101199003078275'
    run()
}

watch(input, () => {
    if (input.value.trim()) run()
    else {
        setOutput('')
        clearError()
    }
})
</script>

<template>
  <UiToolShell title="身份证校验" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">校验</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      <label class="lbl">身份证号</label>
      <input v-model="input" class="inp" placeholder="18 位或 15 位" maxlength="18" />
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="10" readonly />
    </template>
  </UiToolShell>
</template>
