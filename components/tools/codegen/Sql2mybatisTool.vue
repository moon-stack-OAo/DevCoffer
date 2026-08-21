<script setup lang="ts">
import { sqlToMybatisMapper } from '#shared/codegen/templates'
const { input, output, error, setOutput, setError, clearError } = useToolState('User')
function run() {
  clearError()
  try { setOutput(sqlToMybatisMapper(input.value.trim() || 'User')) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="MyBatis 注解 Mapper" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">输入实体名，生成注解版 Mapper 骨架</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="4" />
    </template>
    <template #output>
      <label class="lbl">代码</label>
      <textarea :value="output" class="ta" rows="16" readonly />
    </template>
  </UiToolShell>
</template>
