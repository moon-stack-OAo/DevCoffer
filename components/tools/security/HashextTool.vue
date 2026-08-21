<script setup lang="ts">
import {
  HASHEXT_ALGOS,
  hashExtAll,
  hashExtDigest,
  type HashExtAlgo,
  type HashExtItem,
} from '#shared/security/hashext'

const { input, error, setError, clearError } = useToolState()
const results = ref<Partial<Record<HashExtAlgo, HashExtItem>>>({})
const busy = ref(false)

async function computeOne(algo: HashExtAlgo) {
  clearError()
  if (!input.value) {
    setError('请输入内容')
    return
  }
  busy.value = true
  try {
    const value = hashExtDigest(algo, input.value)
    const meta = HASHEXT_ALGOS.find((a) => a.id === algo)!
    results.value = { ...results.value, [algo]: { id: algo, label: meta.label, value } }
  } catch (e) {
    setError(e instanceof Error ? e.message : '计算失败')
  } finally {
    busy.value = false
  }
}

async function computeAll() {
  clearError()
  if (!input.value) {
    setError('请输入内容')
    return
  }
  busy.value = true
  try {
    const items = hashExtAll(input.value)
    const next: Partial<Record<HashExtAlgo, HashExtItem>> = {}
    for (const it of items) next[it.id] = it
    results.value = next
  } catch (e) {
    setError(e instanceof Error ? e.message : '计算失败')
  } finally {
    busy.value = false
  }
}

function clearResults() {
  results.value = {}
  input.value = ''
  clearError()
}

const ordered = computed(() =>
  HASHEXT_ALGOS.map((a) => results.value[a.id]).filter(Boolean) as HashExtItem[],
)

const copyAll = computed(() =>
  ordered.value.map((it) => `${it.label}: ${it.value}`).join('\n'),
)
</script>

<template>
  <UiToolShell title="Hash 扩展" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" :disabled="busy" @click="computeAll">计算全部</button>
      <button type="button" class="btn btn-ghost" @click="clearResults">清空</button>
      <UiCopyButton :text="copyAll" />
    </template>
    <template #toolbar>
      <p class="hint">
        对输入文本按 UTF-8 字节计算：CRC32、CRC32C、Adler32、SM3。
        SHA-3 / RIPEMD-160 请使用「Hash 计算」工具。
      </p>
    </template>
    <label class="lbl">输入</label>
    <textarea
      v-model="input"
      class="ta"
      rows="10"
      placeholder="要计算 CRC / Adler32 / SM3 的文本"
    />
    <div class="algos">
      <button
        v-for="a in HASHEXT_ALGOS"
        :key="a.id"
        type="button"
        class="btn btn-ghost"
        :disabled="busy"
        @click="computeOne(a.id)"
      >
        {{ a.label }}
      </button>
    </div>
    <div v-if="ordered.length" class="list">
      <div v-for="it in ordered" :key="it.id" class="row">
        <span class="tag">{{ it.label }}</span>
        <code class="val" :class="{ err: it.error }">{{ it.value }}</code>
        <UiCopyButton :text="it.error ? '' : it.value" />
      </div>
    </div>
  </UiToolShell>
</template>

<style scoped>
.algos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tag {
  width: 170px;
  color: var(--text-muted);
  font-size: 0.8rem;
  flex-shrink: 0;
}
.val {
  flex: 1;
  min-width: 0;
  word-break: break-all;
  font-size: 0.8rem;
  color: var(--brand);
  font-family: var(--mono);
}
.val.err {
  color: var(--danger, #ef4444);
}
</style>
