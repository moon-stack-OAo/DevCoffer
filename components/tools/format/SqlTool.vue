<script setup lang="ts">
import {
  formatSql,
  minifySql,
  SQL_DIALECTS,
  SQL_SAMPLE,
  type SqlDialect,
} from '#shared/format/sql'

const { input, output, error, setOutput, setError, clearError } = useToolState(SQL_SAMPLE)

const dialect = ref<SqlDialect>('sql')

async function doFormat() {
  clearError()
  try {
    setOutput(await formatSql(input.value, dialect.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '格式化失败')
  }
}

function doMinify() {
  clearError()
  try {
    setOutput(minifySql(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '压缩失败')
  }
}

function loadSample() {
  input.value = SQL_SAMPLE
  clearError()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="SQL 格式化" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doFormat">格式化</button>
      <button type="button" class="btn btn-ghost" @click="doMinify">压缩</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">格式化前做基础启发式校验（空输入、SELECT/FROM/WHERE 残缺、括号不平衡等）。</p>
      <div class="opts">
        <label>
          方言
          <select v-model="dialect" class="sel">
            <option v-for="d in SQL_DIALECTS" :key="d.value" :value="d.value">
              {{ d.label }}
            </option>
          </select>
        </label>
      </div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" placeholder="SELECT …" spellcheck="false" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>
