<script setup lang="ts">
import { numberToChineseYuan } from '#shared/generate/cnyamount'

const { input, output, error, setOutput, setError, clearError } = useToolState('1234.56')

const EXAMPLES = ['1234.56', '100000000', '-88.08'] as const

function run() {
    clearError()
    try {
        setOutput(numberToChineseYuan(input.value))
    } catch (e) {
        setError(e instanceof Error ? e.message : '转换失败')
        output.value = ''
    }
}

function fillExample(v: string) {
    input.value = v
}

watch(input, () => run(), { immediate: true })
</script>

<template>
  <UiToolShell title="金额大写" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">转换</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <span class="hint" style="margin:0">示例：</span>
        <button
          v-for="ex in EXAMPLES"
          :key="ex"
          type="button"
          class="btn btn-ghost"
          style="padding:2px 8px"
          @click="fillExample(ex)"
        >
          {{ ex }}
        </button>
      </div>
    </template>
    <template #input>
      <label class="lbl">金额（元）</label>
      <input v-model="input" class="inp" placeholder="1234.56" />
    </template>
    <template #output>
      <label class="lbl">中文大写</label>
      <textarea :value="output" class="ta" rows="8" readonly />
    </template>
  </UiToolShell>
</template>
