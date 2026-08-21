<script setup lang="ts">
import { flywayTemplate } from '#shared/codegen/templates'
const ver = ref('1.0.1')
const desc = ref('create_demo')
const { output, error, setOutput, setError, clearError } = useToolState()
function run() {
  clearError()
  try { setOutput(flywayTemplate(ver.value, desc.value)) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
run()
</script>
<template>
  <UiToolShell title="Flyway 迁移模板" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      <label class="lbl">版本</label>
      <input v-model="ver" class="inp" @change="run" />
      <label class="lbl" style="margin-top:10px">描述</label>
      <input v-model="desc" class="inp" @change="run" />
    </template>
    <template #output>
      <label class="lbl">SQL</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>
