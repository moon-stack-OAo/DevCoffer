<script setup lang="ts">
import { bindSql } from '#shared/debug/sqlbind'

const sql = ref('SELECT * FROM user WHERE id = ? AND name = ?')
const params = ref('1\nAlice')
const forceString = ref(false)
const { output, error, setOutput, setError, clearError } = useToolState()

function doBind() {
  clearError()
  try { setOutput(bindSql(sql.value, params.value, forceString.value)) } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>

<template>
  <UiToolShell title="SQL 参数绑定" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doBind">绑定</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">支持 ? 位置参数；或 :name / #{name} 命名参数（JSON 或 key=value）。</p>
      <div class="opts"><label><input v-model="forceString" type="checkbox" /> 强制字符串引号</label></div>
    </template>
    <template #input>
      <label class="lbl">SQL</label>
      <textarea v-model="sql" class="ta" rows="6" />
      <label class="lbl">参数</label>
      <textarea v-model="params" class="ta" rows="6" />
    </template>
    <template #output>
      <label class="lbl">完整 SQL</label>
      <textarea :value="output" class="ta" rows="12" readonly />
    </template>
  </UiToolShell>
</template>

