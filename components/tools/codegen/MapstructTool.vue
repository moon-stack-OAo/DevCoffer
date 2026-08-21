<script setup lang="ts">
import { mapstructTemplate } from '#shared/codegen/templates'
const source = ref('UserDO')
const target = ref('UserDTO')
const { output, error, setOutput, setError, clearError } = useToolState()
function run() {
  clearError()
  try { setOutput(mapstructTemplate(source.value, target.value)) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
run()
</script>
<template>
  <UiToolShell title="MapStruct Mapper" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      <label class="lbl">Source</label>
      <input v-model="source" class="inp" @change="run" />
      <label class="lbl" style="margin-top:10px">Target</label>
      <input v-model="target" class="inp" @change="run" />
    </template>
    <template #output>
      <label class="lbl">代码</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>
