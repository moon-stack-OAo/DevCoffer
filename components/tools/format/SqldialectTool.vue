<script setup lang="ts">
import { sqlDialectConvert, SQL_DIALECT_SAMPLE_MYSQL_ORACLE } from '#shared/format/sqldialect'

const from = ref('mysql')
const to = ref('oracle')
const { input, output, error, setOutput, setError, clearError } = useToolState(
  SQL_DIALECT_SAMPLE_MYSQL_ORACLE,
)

function run() {
  clearError()
  try {
    if (!String(input.value || '').trim()) {
      setError('请输入 SQL')
      return
    }
    setOutput(sqlDialectConvert(input.value, from.value, to.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function loadSample() {
  input.value = SQL_DIALECT_SAMPLE_MYSQL_ORACLE
  from.value = 'mysql'
  to.value = 'oracle'
  clearError()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="SQL 方言转换" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">转换</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label class="opts-inline">
          从
          <select v-model="from" class="sel">
            <option value="mysql">mysql</option>
            <option value="postgres">postgres</option>
          </select>
        </label>
        <label class="opts-inline">
          到
          <select v-model="to" class="sel">
            <option value="postgres">postgres</option>
            <option value="mysql">mysql</option>
            <option value="oracle">oracle</option>
          </select>
        </label>
      </div>
      <p class="hint">启发式类型映射；MySQL LONGTEXT/MEDIUMTEXT/TEXT → Oracle CLOB。</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="10" placeholder="CREATE TABLE …" spellcheck="false" />
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>

<style scoped>
.opts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
}
.opts-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--text-muted);
}
.opts-inline .sel {
  width: auto;
  min-width: 100px;
}
</style>
