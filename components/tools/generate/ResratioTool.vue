<script setup lang="ts">
import {
  computeByRatio,
  computeResRatio,
  formatResRatio,
  RES_BY_RATIO_OPTIONS,
  RESRATIO_PRESETS,
  type ResByResult,
  type ResRatioResult,
} from '#shared/generate/resratio'

const width = ref<number | ''>(1920)
const height = ref<number | ''>(1080)
const result = ref<ResRatioResult | null>(null)

const byDim = ref<'w' | 'h'>('w')
const byValue = ref<number | ''>(1920)
const byRatio = ref('16:9')
const byCustomW = ref<number | ''>(16)
const byCustomH = ref<number | ''>(9)
const byResult = ref<ResByResult | null>(null)
const byError = ref('')

const { error, setError, clearError, setOutput, output } = useToolState()

const plainOut = computed(() => {
  if (!result.value) return ''
  try {
    return formatResRatio(result.value.width, result.value.height)
  } catch {
    return ''
  }
})

const copyText = computed(() => {
  const parts = [plainOut.value]
  if (byResult.value) parts.push('按比例反算: ' + byResult.value.text)
  return parts.filter(Boolean).join('\n\n')
})

function run() {
  clearError()
  const w = width.value
  const h = height.value
  if (w === '' || h === '' || w == null || h == null) {
    result.value = null
    setOutput('')
    return
  }
  try {
    result.value = computeResRatio(w, h)
    setOutput(formatResRatio(w, h))
  } catch (e) {
    result.value = null
    setError(e instanceof Error ? e.message : '失败')
  }
}

function swap() {
  const t = width.value
  width.value = height.value
  height.value = t
}

function clearAll() {
  width.value = ''
  height.value = ''
  result.value = null
  byResult.value = null
  byError.value = ''
  setOutput('')
  clearError()
}

function loadExample() {
  width.value = 1920
  height.value = 1080
}

function applyPreset(w: number, h: number) {
  width.value = w
  height.value = h
}

function runBy() {
  byError.value = ''
  try {
    byResult.value = computeByRatio({
      dim: byDim.value,
      base: byValue.value === '' ? NaN : byValue.value,
      ratio: byRatio.value,
      customW: byCustomW.value === '' ? NaN : byCustomW.value,
      customH: byCustomH.value === '' ? NaN : byCustomH.value,
    })
  } catch (e) {
    byResult.value = null
    byError.value = e instanceof Error ? e.message : '失败'
  }
}

watch([width, height], () => run(), { immediate: true })
watch([byDim, byValue, byRatio, byCustomW, byCustomH], () => runBy(), { immediate: true })
</script>

<template>
  <UiToolShell title="分辨率比例" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn btn-ghost" @click="swap">⇄ 交换</button>
      <button type="button" class="btn btn-ghost" @click="loadExample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="copyText || output" />
    </template>

    <template #toolbar>
      <div class="opts">
        <label>宽 (px)
          <input
            v-model.number="width"
            type="number"
            class="num"
            style="width:120px"
            min="1"
            max="32768"
            placeholder="1920"
          />
        </label>
        <span class="times">×</span>
        <label>高 (px)
          <input
            v-model.number="height"
            type="number"
            class="num"
            style="width:120px"
            min="1"
            max="32768"
            placeholder="1080"
          />
        </label>
      </div>
      <p class="hint">输入即算。宽高比约分、档位匹配、按比例反算。</p>
      <div class="chips">
        <button
          v-for="p in RESRATIO_PRESETS"
          :key="p.label"
          type="button"
          class="chip"
          :class="{ active: width === p.w && height === p.h }"
          @click="applyPreset(p.w, p.h)"
        >
          {{ p.label }}
        </button>
      </div>
    </template>

    <div class="rr-layout">
      <div v-if="result" class="rr-result">
        <div class="rr-ratio">{{ result.ratioW }} : {{ result.ratioH }}</div>
        <div class="rr-ratio-sub">最简整数比例</div>

        <div class="rr-tier" :class="result.tier.exact ? 'is-exact' : 'is-approx'">
          <span class="rr-tier-label">档位</span>
          <span class="rr-tier-badge">{{ result.tier.badge }}</span>
          <span class="rr-tier-name">
            <template v-if="result.tier.exact">
              {{ result.tier.short }} / {{ result.tier.name }} / {{ result.tier.desc }}
            </template>
            <template v-else>
              {{ result.tier.name }} / {{ result.tier.desc }}
            </template>
          </span>
          <span class="rr-tier-mp">({{ result.tier.mp.toFixed(2) }} MP)</span>
          <span class="rr-tier-hint">{{ result.tier.exact ? '标准' : '区间' }}</span>
        </div>

        <div class="rr-rows">
          <div>浮点比例：<b>{{ result.decimal }} : 1</b></div>
          <div v-if="result.matched" class="rr-ok">
            ✓ 匹配标准比例 {{ result.matched.w }}:{{ result.matched.h }}（{{ result.matched.name }}）
          </div>
          <div v-else class="rr-dim">非标准比例</div>
          <div>总像素数：<b>{{ result.totalFmt }}</b> ≈ {{ result.mp }} MP</div>
          <div>宽 × 高：<b>{{ result.width }} × {{ result.height }}</b></div>
          <div>像素宽高比 (PAR)：<b>1:1（方形像素）</b></div>
          <div v-if="!result.isInt" class="rr-warn">
            ⚠ 检测到小数像素，最简比例基于四舍五入，结果可能偏差
          </div>
        </div>
      </div>

      <div v-else class="rr-empty">
        <p class="empty-title">等待计算</p>
        <p class="empty-desc">输入宽高，或点击上方预设 / 示例</p>
      </div>

      <div class="rr-by">
        <div class="lbl">按比例反算</div>
        <div class="opts">
          <label>基准边
            <select v-model="byDim" class="sel">
              <option value="w">按宽</option>
              <option value="h">按高</option>
            </select>
          </label>
          <label>基准值 (px)
            <input
              v-model.number="byValue"
              type="number"
              class="num"
              style="width:100px"
              min="1"
              max="32768"
            />
          </label>
          <label>比例
            <select v-model="byRatio" class="sel">
              <option
                v-for="o in RES_BY_RATIO_OPTIONS"
                :key="o.value"
                :value="o.value"
              >
                {{ o.label }}
              </option>
            </select>
          </label>
          <template v-if="byRatio === 'custom'">
            <label>自定义宽
              <input v-model.number="byCustomW" type="number" class="num" style="width:72px" min="1" />
            </label>
            <span class="times">:</span>
            <label>高
              <input v-model.number="byCustomH" type="number" class="num" style="width:72px" min="1" />
            </label>
          </template>
          <button type="button" class="btn" @click="runBy">计算</button>
        </div>
        <div v-if="byError" class="rr-by-err" role="alert">{{ byError }}</div>
        <div v-else-if="byResult" class="rr-by-out">
          <b>{{ byResult.width }} × {{ byResult.height }}</b>
          （像素总数 {{ byResult.totalFmt }} ≈ {{ byResult.mp }} MP，最简比例 {{ byResult.ratio }}）
        </div>
        <div v-else class="rr-by-hint">调整参数即算</div>
      </div>
    </div>
  </UiToolShell>
</template>

<style scoped>
.times {
  color: var(--text-muted);
  font-size: 20px;
  padding-bottom: 2px;
  align-self: flex-end;
}
.rr-layout {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  min-height: 0;
}
.rr-result {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  background: var(--bg-soft);
}
.rr-ratio {
  font-size: 24px;
  font-weight: 600;
  color: #22c55e;
  margin-bottom: 2px;
}
.rr-ratio-sub {
  color: var(--text-muted);
  font-size: 12px;
  margin-bottom: 10px;
}
.rr-tier {
  margin: 4px 0 10px;
  padding: 8px 10px;
  border-radius: 6px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.rr-tier.is-exact {
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.rr-tier.is-approx {
  background: rgba(234, 179, 8, 0.08);
  border: 1px solid rgba(234, 179, 8, 0.3);
}
.rr-tier-label {
  color: var(--brand, var(--accent));
  font-size: 12px;
  font-weight: 600;
}
.rr-tier-badge {
  display: inline-block;
  min-width: 18px;
  text-align: center;
  font-weight: 700;
}
.rr-tier.is-exact .rr-tier-badge {
  color: #22c55e;
}
.rr-tier.is-approx .rr-tier-badge {
  color: #eab308;
}
.rr-tier-name {
  font-weight: 600;
}
.rr-tier-mp {
  color: var(--text-muted);
  font-size: 12px;
}
.rr-tier-hint {
  margin-left: 4px;
  font-size: 11px;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 6px;
}
.rr-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.9rem;
}
.rr-ok {
  margin-top: 4px;
  color: #22c55e;
}
.rr-dim {
  margin-top: 4px;
  color: var(--text-muted);
}
.rr-warn {
  margin-top: 8px;
  color: var(--danger, #ef4444);
  font-size: 12px;
}
.rr-empty {
  border: 1px dashed var(--border);
  border-radius: 10px;
  padding: 28px 16px;
  text-align: center;
  color: var(--text-muted);
}
.empty-title {
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--text);
}
.empty-desc {
  margin: 0;
  font-size: 0.85rem;
}
.rr-by {
  border: 1px solid var(--border);
  border-radius: var(--radius, 8px);
  padding: 12px;
}
.rr-by-out {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  font-size: 0.9rem;
}
.rr-by-hint {
  margin-top: 10px;
  padding: 8px 12px;
  color: var(--text-muted);
  font-size: 0.85rem;
}
.rr-by-err {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--danger, #ef4444) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--danger, #ef4444) 35%, transparent);
  color: var(--danger, #ef4444);
  font-size: 0.85rem;
}
</style>
