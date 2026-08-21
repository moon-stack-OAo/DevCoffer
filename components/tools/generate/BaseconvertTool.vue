<script setup lang="ts">
import { convertBase } from '#shared/generate/baseconvert'

const QUICKS = [
    { from: 10, to: 16, label: '10→16' },
    { from: 16, to: 10, label: '16→10' },
    { from: 10, to: 2, label: '10→2' },
    { from: 2, to: 10, label: '2→10' },
    { from: 16, to: 2, label: '16→2' },
    { from: 8, to: 10, label: '8→10' },
] as const

const { input, output, error, setOutput, setError, clearError } = useToolState('255')
const fromBase = ref(10)
const toBase = ref(16)
const resultOnly = ref('')
const decText = ref('')
const precisionHint = ref('')

function run() {
    clearError()
    precisionHint.value = ''
    resultOnly.value = ''
    decText.value = ''
    const r = convertBase(input.value, fromBase.value, toBase.value)
    if (!r.ok) {
        setError(r.msg || '转换失败')
        setOutput('')
        return
    }
    resultOnly.value = r.result || ''
    decText.value = String(r.dec ?? '')
    if (r.precisionRisk) {
        precisionHint.value = '数值超过 Number.MAX_SAFE_INTEGER，存在精度风险'
    }
    setOutput(
        [
            r.result,
            '',
            `十进制: ${r.dec}`,
            `${fromBase.value} 进制: ${input.value.trim().toUpperCase()}`,
            `${toBase.value} 进制: ${r.result}`,
        ].join('\n'),
    )
}

function quick(from: number, to: number) {
    fromBase.value = from
    toBase.value = to
    run()
}

function swap() {
    const a = fromBase.value
    fromBase.value = toBase.value
    toBase.value = a
    if (resultOnly.value) input.value = resultOnly.value
    run()
}

watch([input, fromBase, toBase], () => run(), { immediate: true })
</script>

<template>
  <UiToolShell title="进制转换" :error="error">
    <template #actions>
      <UiCopyButton :text="resultOnly" />
    </template>

    <template #input>
      <div class="sec">
        <div class="bases">
          <label class="field">
            <span class="lbl">从进制</span>
            <input v-model.number="fromBase" type="number" min="2" max="36" class="num" />
          </label>
          <button type="button" class="btn btn-ghost swap" title="互换" @click="swap">⇄</button>
          <label class="field">
            <span class="lbl">到进制</span>
            <input v-model.number="toBase" type="number" min="2" max="36" class="num" />
          </label>
        </div>
        <div class="chips">
          <button
            v-for="q in QUICKS"
            :key="q.label"
            type="button"
            class="chip"
            :class="{ active: fromBase === q.from && toBase === q.to }"
            @click="quick(q.from, q.to)"
          >{{ q.label }}</button>
        </div>
      </div>

      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="10" placeholder="数值…" />
      <p class="hint">支持 2–36 进制；字母不区分大小写。</p>
    </template>

    <template #output>
      <p v-if="precisionHint" class="warn">{{ precisionHint }}</p>
      <div class="meta">
        <span class="meta-item">{{ fromBase }} → {{ toBase }}</span>
      </div>
      <div class="result-card">
        <span class="result-lbl">目标进制结果</span>
        <pre class="result-val">{{ resultOnly || '—' }}</pre>
      </div>
      <div class="detail">
        <div class="detail-row">
          <span class="k">十进制</span>
          <span class="v">{{ decText || '—' }}</span>
        </div>
        <div class="detail-row">
          <span class="k">{{ fromBase }} 进制</span>
          <span class="v">{{ input.trim() ? input.trim().toUpperCase() : '—' }}</span>
        </div>
        <div class="detail-row">
          <span class="k">{{ toBase }} 进制</span>
          <span class="v">{{ resultOnly || '—' }}</span>
        </div>
      </div>
    </template>
  </UiToolShell>
</template>

<style scoped>
.sec {
  margin-bottom: 12px;
  flex: 0 0 auto;
}
.bases {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 10px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field .lbl {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}
.num {
  width: 72px;
  padding: 6px 10px;
}
.swap {
  padding: 6px 10px;
  margin-bottom: 1px;
}
.chips { margin-bottom: 0; }
.hint {
  margin: 8px 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
  flex: 0 0 auto;
}
.warn {
  margin: 0 0 8px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid color-mix(in srgb, #f59e0b 40%, var(--border));
  background: color-mix(in srgb, #f59e0b 12%, transparent);
  color: #fbbf24;
  font-size: 0.8rem;
  flex: 0 0 auto;
}
.meta {
  margin-bottom: 8px;
  flex: 0 0 auto;
}
.meta-item {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: var(--mono);
}
.result-card {
  padding: 14px 14px 12px;
  border: 1px solid color-mix(in srgb, var(--brand) 35%, var(--border));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--brand) 10%, transparent);
  margin-bottom: 12px;
  flex: 0 0 auto;
}
.result-lbl {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.result-val {
  margin: 0;
  font-family: var(--mono);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-strong);
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.35;
}
.detail {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 auto;
  min-height: 0;
}
.detail-row {
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
}
.k {
  font-size: 0.75rem;
  color: var(--brand);
  font-weight: 600;
}
.v {
  font-family: var(--mono);
  font-size: 0.86rem;
  color: var(--text);
  word-break: break-all;
}
</style>
