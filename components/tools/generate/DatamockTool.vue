<script setup lang="ts">
import {
  MOCK_FIELDS,
  MOCK_FIELD_KEYS,
  clampMockCount,
  mockToCsv,
  mockToJson,
  type MockFieldKey,
} from '#shared/generate/datamock'

const count = ref(10)
const selected = ref<MockFieldKey[]>([...MOCK_FIELD_KEYS])
const clampTip = ref('')
const { output, error, setOutput, setError, clearError } = useToolState()

function toggle(key: MockFieldKey) {
  if (selected.value.includes(key)) {
    selected.value = selected.value.filter((k) => k !== key)
  } else {
    selected.value = [...selected.value, key]
  }
}

function run(fn: (n: number, fields: MockFieldKey[]) => string) {
  clearError()
  clampTip.value = ''
  if (!selected.value.length) {
    setError('请至少勾选一个字段')
    return
  }
  const { n, tip } = clampMockCount(count.value)
  if (tip) clampTip.value = tip
  try {
    setOutput(fn(n, selected.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function genJson() {
  run(mockToJson)
}

function genCsv() {
  run(mockToCsv)
}

function downloadJson() {
  if (!import.meta.client || !output.value) return
  const blob = new Blob([output.value], { type: 'application/json;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'mock-data.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
</script>

<template>
  <UiToolShell title="Mock 数据" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="genJson">生成 JSON</button>
      <button type="button" class="btn btn-ghost" @click="genCsv">生成 CSV</button>
      <button type="button" class="btn btn-ghost" :disabled="!output" @click="downloadJson">
        下载 JSON
      </button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label v-for="f in MOCK_FIELDS" :key="f.key">
          <input
            type="checkbox"
            :checked="selected.includes(f.key)"
            @change="toggle(f.key)"
          />
          {{ f.label }}
        </label>
      </div>
      <p v-if="clampTip" class="hint">{{ clampTip }}</p>
      <p class="hint">格式样例，非真实数据。条数有效范围 1～500。</p>
    </template>
    <template #input>
      <label class="lbl">条数 <input v-model.number="count" type="number" min="0" max="500" class="inp" style="width:100px" /></label>
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>
