<script setup lang="ts">
import {
  QC_COMMON_ZONES,
  QC_PRESETS,
  formatQuartzParseResult,
  toSpringScheduled,
  type SpringScheduledMode,
} from '#shared/debug/quartzcron'

const { input, error, setError, clearError } = useToolState('0 0 12 * * ?')

const methodName = ref('scheduledTask')
const zone = ref('Asia/Shanghai')
const zoneCustom = ref('')
const mode = ref<SpringScheduledMode>('cron')
const fixedRate = ref('5000')
const fixedDelay = ref('5000')
const initialDelay = ref('')

const desc = ref('')
const parseOut = ref('')
const springOut = ref('')
const parseValid = ref(true)

function effectiveZone() {
  const custom = zoneCustom.value.trim()
  return custom || zone.value.trim()
}

function runParse() {
  clearError()
  try {
    const r = formatQuartzParseResult(input.value)
    desc.value = r.desc
    parseOut.value = r.text
    parseValid.value = r.valid
    if (!r.valid && r.parsed.length < 6) {
      setError(r.parsed.errors.join('；') || '解析失败')
    }
  } catch (e) {
    desc.value = ''
    parseOut.value = ''
    parseValid.value = false
    setError(e instanceof Error ? e.message : '解析失败')
  }
}

function runSpring() {
  clearError()
  try {
    if (mode.value === 'cron') {
      const r = formatQuartzParseResult(input.value)
      if (!r.valid && r.parsed.length !== 6 && r.parsed.length !== 7) {
        throw new Error(r.parsed.errors.join('；') || 'cron 无效')
      }
      desc.value = r.desc
      parseOut.value = r.text
      parseValid.value = r.valid
    }
    const snippets = toSpringScheduled({
      cron: input.value,
      zone: effectiveZone(),
      mode: mode.value,
      fixedRate: fixedRate.value,
      fixedDelay: fixedDelay.value,
      initialDelay: initialDelay.value,
      methodName: methodName.value || 'scheduledTask',
    })
    springOut.value = snippets.all
  } catch (e) {
    springOut.value = ''
    setError(e instanceof Error ? e.message : '生成失败')
  }
}

function applyPreset(expr: string) {
  input.value = expr
  runParse()
}

function loadSample() {
  input.value = '0 0 12 * * ?'
  zone.value = 'Asia/Shanghai'
  zoneCustom.value = ''
  runParse()
}

function clearAll() {
  input.value = ''
  zone.value = 'Asia/Shanghai'
  zoneCustom.value = ''
  methodName.value = 'scheduledTask'
  mode.value = 'cron'
  fixedRate.value = '5000'
  fixedDelay.value = '5000'
  initialDelay.value = ''
  desc.value = ''
  parseOut.value = ''
  springOut.value = ''
  parseValid.value = true
  clearError()
}

onMounted(() => runParse())
</script>

<template>
  <UiToolShell title="Quartz / 定时表达式" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="runParse">解析 / 描述</button>
      <button type="button" class="btn" @click="runSpring">生成 @Scheduled</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="parseOut" label="复制解析" />
      <UiCopyButton :text="springOut" label="复制代码" />
    </template>

    <template #toolbar>
      <div class="top">
        <div class="expr-wrap">
          <label class="lbl">Quartz Cron（秒 分 时 日 月 周 [年]）</label>
          <input
            v-model="input"
            class="inp expr"
            placeholder="0 0 12 * * ?"
            @keydown.enter.prevent="runParse"
          />
        </div>
        <div class="field method">
          <label class="lbl">方法名</label>
          <input v-model="methodName" class="inp" type="text" />
        </div>
        <div class="field zone">
          <label class="lbl">时区 zone</label>
          <select v-model="zone" class="sel">
            <option value="">（不指定 / 服务器默认）</option>
            <option v-for="z in QC_COMMON_ZONES" :key="z" :value="z">{{ z }}</option>
          </select>
        </div>
        <div class="field zone-custom">
          <label class="lbl">自定义时区（可选）</label>
          <input v-model="zoneCustom" class="inp" type="text" placeholder="如 America/Chicago" />
        </div>
      </div>

      <div class="presets">
        <button
          v-for="p in QC_PRESETS"
          :key="p.expr"
          type="button"
          class="btn btn-ghost sm"
          @click="applyPreset(p.expr)"
        >
          {{ p.label }}
        </button>
      </div>

      <div class="sched-row">
        <label class="mode-label">
          @Scheduled 模式
          <select v-model="mode" class="sel mode-sel">
            <option value="cron">cron</option>
            <option value="fixedRate">fixedRate</option>
            <option value="fixedDelay">fixedDelay</option>
          </select>
        </label>
        <div class="field sm-field">
          <label class="lbl">fixedRate (ms)</label>
          <input v-model="fixedRate" class="inp" type="text" placeholder="5000" />
        </div>
        <div class="field sm-field">
          <label class="lbl">fixedDelay (ms)</label>
          <input v-model="fixedDelay" class="inp" type="text" placeholder="5000" />
        </div>
        <div class="field sm-field">
          <label class="lbl">initialDelay</label>
          <input v-model="initialDelay" class="inp" type="text" placeholder="0" />
        </div>
      </div>
    </template>

    <div v-if="desc" class="qc-desc" :class="{ warn: !parseValid }">{{ desc }}</div>

    <div class="out-block">
      <label class="lbl">解析结果 / 差异说明</label>
      <textarea
        :value="parseOut"
        class="ta"
        :class="{ 'ta-warn': !parseValid && parseOut }"
        rows="12"
        readonly
      />
    </div>

    <div class="out-block">
      <label class="lbl">Spring @Scheduled 代码</label>
      <textarea :value="springOut" class="ta mono" rows="10" readonly />
    </div>

    <div class="hint">
      <strong>提示：</strong>「Cron 表达式」工具侧重下次执行时间；本工具侧重 Quartz 语义（<code>? L W #</code>）、与 Unix 5 段差异，以及 Spring <code>@Scheduled</code> 片段生成。
    </div>
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
  flex: 1 1 260px;
  min-width: 0;
}
.expr {
  font-family: var(--font-mono, ui-monospace, monospace);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.method {
  width: 140px;
}
.zone {
  flex: 1 1 180px;
  min-width: 160px;
}
.zone-custom {
  flex: 1 1 160px;
  min-width: 140px;
}
.sel {
  width: 100%;
  min-height: 34px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius, 6px);
  background: var(--bg-input, transparent);
  color: var(--text);
  font-size: 0.875rem;
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
.sched-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  margin-top: 10px;
}
.mode-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
}
.mode-sel {
  width: 120px;
}
.sm-field {
  width: 120px;
}
.qc-desc {
  padding: 8px 12px;
  margin-bottom: 10px;
  font-size: 0.8125rem;
  color: var(--text-muted, #94a3b8);
  background: color-mix(in srgb, var(--accent, #818cf8) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent, #818cf8) 22%, var(--border));
  border-radius: var(--radius, 6px);
  line-height: 1.5;
}
.qc-desc.warn {
  color: var(--warn, #fbbf24);
  background: color-mix(in srgb, var(--warn, #fbbf24) 10%, transparent);
  border-color: color-mix(in srgb, var(--warn, #fbbf24) 35%, var(--border));
}
.out-block {
  margin-bottom: 12px;
}
.out-block .ta {
  min-height: 180px;
}
.ta-warn {
  border-color: color-mix(in srgb, var(--warn, #fbbf24) 50%, var(--border)) !important;
}
.mono {
  font-family: var(--font-mono, ui-monospace, monospace);
}
.hint {
  margin-top: 4px;
  padding: 10px 12px;
  font-size: 0.75rem;
  line-height: 1.55;
  color: var(--text-muted, #94a3b8);
  background: var(--glass, color-mix(in srgb, var(--bg-card-from, #1e293b) 80%, transparent));
  border: 1px solid var(--border);
  border-radius: var(--radius, 6px);
}
.hint code {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.85em;
  padding: 0 4px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--text) 8%, transparent);
}
</style>
