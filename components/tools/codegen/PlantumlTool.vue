<script setup lang="ts">
import { ddlToPlantuml, plantumlWrap } from '#shared/codegen/plantuml'
const mode = ref<'raw'|'ddl'>('raw')
const { input, output, error, setOutput, setError, clearError } = useToolState('Alice -> Bob: hello')
function run() {
  clearError()
  try { setOutput(mode.value === 'ddl' ? ddlToPlantuml(input.value) : plantumlWrap(input.value)) }
  catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
run()
</script>
<template>
  <UiToolShell title="PlantUML" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
      <a class="btn btn-ghost" href="https://www.plantuml.com/plantuml/uml/" target="_blank" rel="noopener">官方编辑器</a>
    </template>
    <template #toolbar>
      <p class="hint">输出源码；请复制到 PlantUML 官方编辑器预览</p>
      <div class="opts"><label>模式<select v-model="mode" class="sel"><option value="raw">源码包装</option><option value="ddl">DDL→实体</option></select></label></div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="10" />
    </template>
    <template #output>
      <label class="lbl">PlantUML</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>
