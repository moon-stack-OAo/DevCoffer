<script setup lang="ts">
import { calcCvss31, CVSS_OPTIONS, parseCvss31Vector } from '#shared/security/cvss'

const metrics = reactive({
    AV: 'N',
    AC: 'L',
    PR: 'N',
    UI: 'N',
    S: 'U',
    C: 'H',
    I: 'H',
    A: 'H',
})
const vectorInput = ref('')
const { output, error, setOutput, setError, clearError } = useToolState()

function calc() {
    clearError()
    try {
        const r = calcCvss31({ ...metrics })
        vectorInput.value = r.vector
        setOutput(
            [
                `Base Score: ${r.baseScore}`,
                `Severity: ${r.severity}`,
                `Impact: ${r.impact}`,
                `Exploitability: ${r.exploitability}`,
                `ISS: ${r.iss}`,
                `Vector: ${r.vector}`,
            ].join('\n'),
        )
    } catch (e) {
        setError(e instanceof Error ? e.message : '计算失败')
    }
}

function fromVector() {
    clearError()
    try {
        const m = parseCvss31Vector(vectorInput.value)
        for (const k of Object.keys(metrics) as (keyof typeof metrics)[]) {
            if (m[k]) metrics[k] = m[k]!
        }
        calc()
    } catch (e) {
        setError(e instanceof Error ? e.message : '向量解析失败')
    }
}

watch(metrics, () => calc(), { deep: true, immediate: true })

const scoreColor = computed(() => {
    const s = output.value.match(/Severity: (\w+)/)?.[1]
    if (s === 'Critical' || s === 'High') return 'var(--danger)'
    if (s === 'Medium') return 'var(--warning)'
    if (s === 'Low') return 'var(--success)'
    return 'var(--text-muted)'
})
</script>

<template>
  <UiToolShell title="CVSS 3.1 评分" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="calc">计算</button>
      <button type="button" class="btn btn-ghost" @click="fromVector">从向量填充</button>
      <UiCopyButton :text="output" />
    </template>
    <div class="metrics">
      <label v-for="(opts, key) in CVSS_OPTIONS" :key="key" class="m">
        {{ key }}
        <select v-model="(metrics as any)[key]" class="sel">
          <option v-for="o in opts" :key="o.v" :value="o.v">{{ o.v }} — {{ o.l }}</option>
        </select>
      </label>
    </div>
    <label class="lbl">向量</label>
    <input v-model="vectorInput" class="inp" placeholder="CVSS:3.1/AV:N/AC:L/…" />
    <pre class="out" :style="{ borderColor: scoreColor }">{{ output }}</pre>
  </UiToolShell>
</template>

<style scoped>
.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}
.m {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.out {
  margin: 0;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.85rem;
  white-space: pre-wrap;
}
</style>
