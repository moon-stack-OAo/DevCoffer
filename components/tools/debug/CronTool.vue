<script setup lang="ts">
import {
  buildCronExpr,
  cronModeOf,
  CRON_PRESETS,
  DEFAULT_CRON_STATE,
  getCronFields,
  guessCronStep,
  DOW_LABELS,
  MONTH_LABELS,
  parseCron,
  parseExprToState,
  type CronFieldDef,
  type CronFieldId,
  type CronState,
} from '#shared/debug/cron'

const { input, output, error, setOutput, setError, clearError } = useToolState('0 */5 * * * * *')
const count = ref(5)
const desc = ref('')
const state = reactive<CronState>({ ...DEFAULT_CRON_STATE, minute: '*/5' })
const fields = getCronFields()
const activeFieldId = ref<CronFieldId>('minute')
const activeField = computed(() => fields.find((f) => f.id === activeFieldId.value) ?? fields[0]!)
let syncingFromInput = false

function cellLabel(field: CronFieldDef, v: number): string {
  if (field.id === 'dow') return DOW_LABELS[v] ?? String(v)
  if (field.id === 'month') return MONTH_LABELS[v] ?? String(v)
  return String(v)
}

function syncInputFromState() {
  syncingFromInput = true
  input.value = buildCronExpr(state)
  syncingFromInput = false
  runParse()
}

function applyState(next: CronState) {
  Object.assign(state, next)
}

function setMode(fid: CronFieldId, mode: 0 | 1 | 2) {
  const field = fields.find((f) => f.id === fid)!
  if (mode === 0) state[fid] = '*'
  else if (mode === 1) state[fid] = `*/${guessCronStep(field)}`
  else state[fid] = String(field.min)
  syncInputFromState()
}

function onRangeChange(fid: CronFieldId, start: number, step: number) {
  const field = fields.find((f) => f.id === fid)!
  const s = Number.isFinite(start) ? start : field.min
  const st = step > 0 ? step : guessCronStep(field)
  state[fid] = `${s}/${st}`
  syncInputFromState()
}

function rangeParts(fid: CronFieldId, field: CronFieldDef): { start: number; step: number } {
  const cur = state[fid]
  if (!cur.includes('/')) return { start: field.min, step: guessCronStep(field) }
  const [a, b] = cur.split('/')
  return {
    start: a === '*' ? field.min : parseInt(a!, 10) || field.min,
    step: parseInt(b!, 10) || guessCronStep(field),
  }
}

function toggleCell(fid: CronFieldId, v: number) {
  const cur = state[fid]
  if (cur === '*' || cur.includes('/')) return
  const nums = cur.split(',').map(Number).filter((n) => !isNaN(n))
  const idx = nums.indexOf(v)
  if (idx >= 0) nums.splice(idx, 1)
  else nums.push(v)
  nums.sort((a, b) => a - b)
  state[fid] = nums.length ? nums.join(',') : '*'
  syncInputFromState()
}

function isSelected(fid: CronFieldId, v: number): boolean {
  const cur = state[fid]
  if (cronModeOf(cur) !== 2) return false
  return cur.split(',').map(Number).includes(v)
}

function runParse() {
  clearError()
  try {
    const r = parseCron(input.value, count.value)
    desc.value = r.description
    setOutput(r.text)
  } catch (e) {
    desc.value = ''
    setError(e instanceof Error ? e.message : '解析失败')
  }
}

function applyPreset(expr: string) {
  applyState(parseExprToState(expr))
  syncingFromInput = true
  input.value = buildCronExpr(state)
  syncingFromInput = false
  runParse()
}

watch(input, (v) => {
  if (syncingFromInput) return
  const n = v.trim().split(/\s+/).filter(Boolean).length
  if (n === 5 || n === 6 || n === 7) applyState(parseExprToState(v))
  runParse()
})

watch(count, () => runParse())

onMounted(() => {
  applyState(parseExprToState(input.value))
  runParse()
})
</script>

<template>
  <UiToolShell title="Cron 表达式" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="runParse">解析</button>
      <UiCopyButton :text="input" label="复制表达式" />
      <UiCopyButton :text="output" label="复制结果" />
    </template>

    <template #toolbar>
      <div class="top">
        <div class="expr-wrap">
          <label class="lbl">Cron 表达式（5～7 段：秒 分 时 日 月 周 [年]）</label>
          <input v-model="input" class="inp expr" placeholder="0 */5 * * * * *" />
        </div>
        <div class="count-wrap">
          <label class="lbl">生成次数</label>
          <input v-model.number="count" class="inp" type="number" min="1" max="20" />
        </div>
      </div>
      <div class="presets">
        <button
          v-for="p in CRON_PRESETS"
          :key="p.expr"
          type="button"
          class="btn btn-ghost sm"
          @click="applyPreset(p.expr)"
        >
          {{ p.label }}
        </button>
      </div>
    </template>

    <div class="cron-fields">
      <div class="cron-tabs" role="tablist">
        <button
          v-for="field in fields"
          :key="field.id"
          type="button"
          role="tab"
          class="cron-tab"
          :class="{ active: activeFieldId === field.id }"
          :aria-selected="activeFieldId === field.id"
          @click="activeFieldId = field.id"
        >
          <span class="cron-tab-name">{{ field.name }}</span>
          <span class="cron-tab-val">{{ state[field.id] }}</span>
        </button>
      </div>

      <div class="cron-field-panel">
        <div class="cron-field-header">
          <span class="cron-field-label">{{ activeField.name }}</span>
          <div class="cron-mode-row">
            <button
              type="button"
              class="cron-mode-btn"
              :class="{ active: cronModeOf(state[activeField.id]) === 0 }"
              @click="setMode(activeField.id, 0)"
            >
              任意
            </button>
            <button
              type="button"
              class="cron-mode-btn"
              :class="{ active: cronModeOf(state[activeField.id]) === 1 }"
              @click="setMode(activeField.id, 1)"
            >
              间隔
            </button>
            <button
              type="button"
              class="cron-mode-btn"
              :class="{ active: cronModeOf(state[activeField.id]) === 2 }"
              @click="setMode(activeField.id, 2)"
            >
              指定
            </button>
          </div>
        </div>

        <div v-if="cronModeOf(state[activeField.id]) === 0" class="cron-hint">
          每{{ activeField.name }}都触发（*）
        </div>

        <div v-else-if="cronModeOf(state[activeField.id]) === 1" class="cron-range-row">
          从
          <input
            class="inp range"
            type="number"
            :min="activeField.min"
            :max="activeField.max"
            :value="rangeParts(activeField.id, activeField).start"
            @change="onRangeChange(activeField.id, Number(($event.target as HTMLInputElement).value), rangeParts(activeField.id, activeField).step)"
          />
          开始, 每
          <input
            class="inp range"
            type="number"
            min="1"
            :max="activeField.max"
            :value="rangeParts(activeField.id, activeField).step"
            @change="onRangeChange(activeField.id, rangeParts(activeField.id, activeField).start, Number(($event.target as HTMLInputElement).value))"
          />
          {{ activeField.name }}
        </div>

        <div v-else class="cron-grid">
          <button
            v-for="v in activeField.values"
            :key="v"
            type="button"
            class="cron-cell"
            :class="{ selected: isSelected(activeField.id, v) }"
            @click="toggleCell(activeField.id, v)"
          >
            {{ cellLabel(activeField, v) }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="desc" class="cron-desc">{{ desc }}</div>

    <label class="lbl">下次执行时间</label>
    <textarea :value="output" class="ta" rows="10" readonly />
  </UiToolShell>
</template>

<style scoped>
.top {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}
.expr-wrap {
  flex: 1 1 280px;
  min-width: 0;
}
.expr {
  font-family: var(--font-mono, ui-monospace, monospace);
}
.count-wrap {
  width: 100px;
}
.count-wrap .inp {
  width: 70px;
}
.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.sm {
  padding: 3px 10px;
  font-size: 0.75rem;
  min-height: 28px;
}
.cron-fields {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 10px;
}
.cron-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin-bottom: 0;
  border-bottom: 1px solid var(--border);
}
.cron-tab {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 48px;
  padding: 8px 14px 10px;
  margin-bottom: -1px;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  line-height: 1.2;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.cron-tab:hover {
  color: var(--text-strong, #e2e8f0);
}
.cron-tab.active {
  color: var(--accent, #818cf8);
  border-bottom-color: var(--accent, #818cf8);
  font-weight: 600;
}
.cron-tab-name {
  font-size: 13px;
  font-weight: inherit;
}
.cron-tab-val {
  font-size: 10px;
  font-family: var(--font-mono, ui-monospace, monospace);
  max-width: 56px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.75;
  font-weight: 400;
}
.cron-tab.active .cron-tab-val {
  opacity: 0.9;
}
.cron-field-panel {
  background: var(--bg-input, rgba(15, 23, 42, 0.45));
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  padding: 12px 14px;
  min-height: 120px;
}
.cron-field-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.cron-field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent, #38bdf8);
  width: 28px;
  flex-shrink: 0;
  text-align: center;
}
.cron-hint {
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
  padding: 4px 0;
}
.cron-mode-row {
  display: flex;
  gap: 4px;
}
.cron-mode-btn {
  padding: 3px 12px;
  min-height: 26px;
  font-size: 11px;
  border-radius: 4px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
}
.cron-mode-btn.active {
  background: color-mix(in srgb, var(--accent, #38bdf8) 18%, transparent);
  border-color: var(--accent, #38bdf8);
  color: var(--accent, #38bdf8);
}
.cron-range-row {
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
  margin: 6px 0 2px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.inp.range {
  width: 64px;
  padding: 3px 6px;
  font-size: 11px;
}
.cron-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 6px;
}
.cron-cell {
  width: 32px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 11px;
  font-family: var(--font-mono, ui-monospace, monospace);
  background: var(--bg-card, rgba(15, 23, 42, 0.6));
  border: 1px solid var(--border);
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  padding: 0;
}
.cron-cell.selected {
  background: color-mix(in srgb, var(--accent, #38bdf8) 18%, transparent);
  border-color: var(--accent, #38bdf8);
  color: var(--accent, #38bdf8);
  font-weight: 600;
}
.cron-desc {
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-muted, #94a3b8);
  margin-bottom: 10px;
  background: var(--bg-input, rgba(15, 23, 42, 0.45));
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  line-height: 1.5;
}
.ta {
  min-height: 160px;
}
</style>
