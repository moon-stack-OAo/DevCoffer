<script setup lang="ts">
import { STREAM_TEMPLATES, getStreamTemplate } from '#shared/codegen/javastream'

const selected = ref(STREAM_TEMPLATES[0]!.id)
const { output, error, setOutput, setError, clearError } = useToolState()

function doGen() {
  clearError()
  try { setOutput(getStreamTemplate(selected.value)) } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
doGen()
</script>

<template>
  <UiToolShell title="Java Stream 模板" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doGen">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      <label class="lbl">模板</label>
      <select v-model="selected" class="sel" style="width:100%;margin-bottom:8px" @change="doGen">
        <option v-for="t in STREAM_TEMPLATES" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
    </template>
    <template #output>
      <label class="lbl">代码</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>

