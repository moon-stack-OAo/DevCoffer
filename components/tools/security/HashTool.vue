<script setup lang="ts">
import { HASH_ALGOS, hashDigest, type HashAlgo } from '#shared/security/hash'

const { input, error, setError, clearError } = useToolState()
const results = ref<Partial<Record<HashAlgo, string>>>({})
const busy = ref(false)

async function computeOne(algo: HashAlgo) {
    clearError()
    if (!input.value) {
        setError('请输入内容')
        return
    }
    busy.value = true
    try {
        results.value = { ...results.value, [algo]: await hashDigest(algo, input.value) }
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
        const next: Partial<Record<HashAlgo, string>> = {}
        for (const a of HASH_ALGOS) {
            next[a.id] = await hashDigest(a.id, input.value)
        }
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

const copyAll = computed(() =>
    HASH_ALGOS.filter((a) => results.value[a.id])
        .map((a) => `${a.label}: ${results.value[a.id]}`)
        .join('\n'),
)
</script>

<template>
  <UiToolShell title="Hash 计算" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" :disabled="busy" @click="computeAll">全部计算</button>
      <button type="button" class="btn btn-ghost" @click="clearResults">清空</button>
      <UiCopyButton :text="copyAll" />
    </template>
    <label class="lbl">输入</label>
    <textarea v-model="input" class="ta" rows="10" placeholder="待摘要文本…" />
    <div class="algos">
      <button
        v-for="a in HASH_ALGOS"
        :key="a.id"
        type="button"
        class="btn btn-ghost"
        :disabled="busy"
        @click="computeOne(a.id)"
      >
        {{ a.label }}
      </button>
    </div>
    <div v-if="Object.keys(results).length" class="list">
      <div v-for="a in HASH_ALGOS" :key="a.id" class="row">
        <template v-if="results[a.id]">
          <span class="tag">{{ a.label }}</span>
          <code class="val">{{ results[a.id] }}</code>
          <UiCopyButton :text="results[a.id] || ''" />
        </template>
      </div>
    </div>
  </UiToolShell>
</template>

<style scoped>
.algos { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
.list { display: flex; flex-direction: column; gap: 8px; }
.row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tag { width: 72px; color: var(--text-muted); font-size: 0.8rem; flex-shrink: 0; }
.val {
  flex: 1;
  min-width: 0;
  word-break: break-all;
  font-size: 0.8rem;
  color: var(--brand);
  font-family: var(--mono);
}
</style>
