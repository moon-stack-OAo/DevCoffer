<script setup lang="ts">
import { testGenTemplate } from '#shared/codegen/templates'
const fw = ref<'junit5' | 'jmh'>('junit5')
const { input, output, error, setOutput, setError, clearError } = useToolState('FooService')
function run() {
  clearError()
  try { setOutput(testGenTemplate(input.value.trim() || 'FooService', fw.value)) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="测试 / JMH 骨架" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>类型
          <select v-model="fw" class="sel">
            <option value="junit5">JUnit5</option>
            <option value="jmh">JMH</option>
          </select>
        </label>
      </div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="3" />
    </template>
    <template #output>
      <label class="lbl">代码</label>
      <textarea :value="output" class="ta" rows="16" readonly />
    </template>
  </UiToolShell>
</template>
