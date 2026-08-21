<script setup lang="ts">
import { dbTypeTable, filterDbTypeMap, type DbDialect } from '#shared/format/dbtype'

const { output, error, setOutput } = useToolState()
const q = ref('')
const dialect = ref<DbDialect>('all')

const filtered = computed(() => filterDbTypeMap(q.value, dialect.value))

watch(
  filtered,
  (rows) => {
    setOutput(dbTypeTable(rows.length ? rows : []))
  },
  { immediate: true },
)

function clearFilter() {
  q.value = ''
  dialect.value = 'all'
}
</script>

<template>
  <UiToolShell title="数据库类型映射" :error="error" :dual="false">
    <template #actions>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">Java ↔ MySQL / PostgreSQL / Oracle 常用类型对照（可复制 Markdown 表格）</p>
      <div class="opts">
        <label class="search-label">搜索
          <input
            v-model="q"
            class="inp search-inp"
            type="search"
            placeholder="按类型名过滤，如 String / BIGINT"
          />
        </label>
        <label>方言
          <select v-model="dialect" class="sel">
            <option value="all">全部</option>
            <option value="mysql">MySQL</option>
            <option value="postgres">PostgreSQL</option>
            <option value="oracle">Oracle</option>
          </select>
        </label>
        <button v-if="q || dialect !== 'all'" type="button" class="btn btn-ghost" @click="clearFilter">
          清除筛选
        </button>
      </div>
    </template>
    <div class="table-wrap">
      <table class="type-table">
        <thead>
          <tr>
            <th>Java</th>
            <th>MySQL</th>
            <th>PostgreSQL</th>
            <th>Oracle</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filtered" :key="r.java">
            <td><code>{{ r.java }}</code></td>
            <td>{{ r.mysql }}</td>
            <td>{{ r.postgres }}</td>
            <td>{{ r.oracle }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!filtered.length" class="empty-hint">无匹配类型，试试清空搜索或切换方言</p>
    </div>
    <label class="lbl md-lbl">Markdown</label>
    <textarea :value="output" class="ta" rows="8" readonly placeholder="筛选结果会同步到此处…" />
  </UiToolShell>
</template>

<style scoped>
.opts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.search-label {
  flex: 1 1 180px;
  min-width: 0;
}
.search-inp {
  width: 100%;
  max-width: 280px;
}
.table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  max-width: 100%;
}
.type-table {
  width: 100%;
  min-width: 480px;
  border-collapse: collapse;
  font-size: 0.84rem;
}
.type-table th,
.type-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.type-table th {
  color: var(--text-muted);
  font-weight: 600;
  background: var(--bg-soft);
  position: sticky;
  top: 0;
}
.type-table tr:last-child td {
  border-bottom: none;
}
.type-table code {
  background: transparent;
  padding: 0;
  color: #7dd3fc;
}
.empty-hint {
  margin: 12px;
  color: var(--text-muted);
  font-size: 0.86rem;
}
.md-lbl {
  margin-top: 12px;
  display: block;
}
</style>
