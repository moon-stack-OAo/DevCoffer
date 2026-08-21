<script setup lang="ts">
import { generateBuilder } from '#shared/codegen/javabuilder'

const className = ref('User')
const lombok = ref(false)
const { input, output, error, setOutput, setError, clearError } = useToolState('String name\nInteger age\nBoolean active')

function doGen() {
  clearError()
  try { setOutput(generateBuilder(className.value, input.value, lombok.value)) } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>

<template>
  <UiToolShell title="Java Builder 生成" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doGen">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>类名 <input v-model="className" class="inp" /></label>
        <label><input v-model="lombok" type="checkbox" /> Lombok @Builder</label>
      </div>
    </template>
    <template #input>
      <label class="lbl">字段（每行 type name）</label>
      <textarea v-model="input" class="ta" rows="10" />
    </template>
    <template #output>
      <label class="lbl">代码</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>

