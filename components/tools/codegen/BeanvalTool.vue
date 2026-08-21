<script setup lang="ts">
import { generateBeanVal } from '#shared/codegen/beanval'

const className = ref('UserRequest')
const { input, output, error, setOutput, setError, clearError } = useToolState('String name\nString email\nString mobile\nInteger age')

function doGen() {
  clearError()
  try { setOutput(generateBeanVal(className.value, input.value)) } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>

<template>
  <UiToolShell title="Bean Validation 注解" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doGen">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts"><label>类名 <input v-model="className" class="inp" /></label></div>
      <p class="hint">按字段名启发式：email→@Email，mobile→手机 Pattern 等。</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="10" />
    </template>
    <template #output>
      <label class="lbl">代码</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>

