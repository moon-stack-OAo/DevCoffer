<script setup lang="ts">
import {
  calcSpecificityResult,
  SPECIFICITY_PRESETS,
  specificityBarPct,
  type SpecificityResult,
} from '#shared/debug/specificity'

const { error, setError, clearError } = useToolState()
const input = ref('#app .nav a.active')
const result = ref<SpecificityResult | null>(null)

const barMax = computed(() => {
  if (!result.value) return 5
  return Math.max(5, result.value.a, result.value.b, result.value.c)
})

const plainOut = computed(() => result.value?.text || '')

function run() {
  clearError()
  try {
    result.value = calcSpecificityResult(input.value)
  } catch (e) {
    result.value = null
    setError(e instanceof Error ? e.message : '失败')
  }
}

function applyPreset(value: string) {
  input.value = value
}

function clearAll() {
  input.value = ''
  result.value = null
  clearError()
}

watch(input, () => {
  if (!input.value.trim()) {
    result.value = null
    clearError()
    return
  }
  run()
})

onMounted(() => run())
</script>

<template>
  <UiToolShell title="选择器优先级" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="run">计算</button>
      <UiCopyButton :text="plainOut" />
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
    </template>

    <template #toolbar>
      <div class="presets">
        <span class="muted">示例</span>
        <button
          v-for="p in SPECIFICITY_PRESETS"
          :key="p.value"
          type="button"
          class="btn btn-ghost sm"
          @click="applyPreset(p.value)"
        >
          {{ p.label }}
        </button>
      </div>
    </template>

    <div class="spc-layout">
      <div class="spc-input-card">
        <label class="lbl">CSS 选择器</label>
        <input
          v-model="input"
          class="inp mono"
          placeholder="#app .nav a.active"
          @keydown.enter.prevent="run"
        />
        <p class="hint">输入后即时计算；!important 与内联样式不计入。</p>
      </div>

      <div v-if="result" class="spc-result">
        <div class="spc-summary">
          <div class="spc-card">
            <div class="spc-card-label">优先级 (a, b, c)</div>
            <div class="spc-card-value">({{ result.a }}, {{ result.b }}, {{ result.c }})</div>
          </div>
          <div class="spc-card">
            <div class="spc-card-label">权重分</div>
            <div class="spc-card-value">{{ result.score }}</div>
          </div>
        </div>

        <div class="spc-bars">
          <div class="spc-bar">
            <span class="spc-bar-label">a · ID</span>
            <span class="spc-bar-num">{{ result.a }}</span>
            <div class="spc-bar-track">
              <div
                class="spc-bar-fill spc-bar-a"
                :style="{ width: specificityBarPct(result.a, barMax) + '%' }"
              />
            </div>
          </div>
          <div class="spc-bar">
            <span class="spc-bar-label">b · class / 属性 / 伪类</span>
            <span class="spc-bar-num">{{ result.b }}</span>
            <div class="spc-bar-track">
              <div
                class="spc-bar-fill spc-bar-b"
                :style="{ width: specificityBarPct(result.b, barMax) + '%' }"
              />
            </div>
          </div>
          <div class="spc-bar">
            <span class="spc-bar-label">c · 类型 / 伪元素</span>
            <span class="spc-bar-num">{{ result.c }}</span>
            <div class="spc-bar-track">
              <div
                class="spc-bar-fill spc-bar-c"
                :style="{ width: specificityBarPct(result.c, barMax) + '%' }"
              />
            </div>
          </div>
        </div>

        <div class="spc-explain">
          <p>
            选择器 <b><code>{{ result.selector }}</code></b>
            的特异性为 <b>({{ result.a }}, {{ result.b }}, {{ result.c }})</b>，
            权重分 <b>{{ result.score }}</b>（a×100 + b×10 + c）。
          </p>
          <p>
            比较规则：先比 a，再比 b，再比 c；数值更大者优先级更高。
            <code>!important</code> 与内联 <code>style=""</code> 未计入本工具。
          </p>
        </div>
      </div>

      <div v-else class="spc-empty">
        <p class="empty-title">等待计算</p>
        <p class="empty-desc">输入 CSS 选择器，或点击上方示例</p>
      </div>
    </div>
  </UiToolShell>
</template>

<style scoped>
.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.muted {
  font-size: 12px;
  color: var(--text-muted);
  margin-right: 2px;
}
.sm {
  padding: 2px 8px;
  font-size: 0.75rem;
  min-height: 26px;
}
.spc-layout {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  min-height: 0;
}
.spc-input-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  background: var(--bg-input, rgba(15, 23, 42, 0.35));
}
.lbl {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin: 0 0 6px;
}
.mono {
  width: 100%;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 13px;
}
.hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.45;
}
.spc-result {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.spc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 40px 16px;
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: 10px;
  background: var(--bg-soft);
}
.empty-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
}
.empty-desc {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}
.spc-explain p {
  margin: 0 0 8px;
}
.spc-explain p:last-child {
  margin-bottom: 0;
}
.spc-explain code {
  font-size: 12px;
  font-family: var(--font-mono, ui-monospace, monospace);
}
</style>
