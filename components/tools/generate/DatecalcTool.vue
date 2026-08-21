<script setup lang="ts">
import { bizDays, bizDaysAdd, dateAdd, dateDiff, formatDateTime, type DateUnit } from '#shared/generate/datecalc'

const nowText = ref('')
const base = ref('')
const amount = ref(7)
const unit = ref<DateUnit>('day')
const op = ref<'add' | 'sub'>('add')
const bizAmount = ref(5)
const bizOp = ref<'add' | 'sub'>('add')
const diff1 = ref('')
const diff2 = ref('')
const diffUnit = ref<DateUnit>('day')
const { output, error, setOutput, setError, clearError } = useToolState()
let timer: ReturnType<typeof setInterval> | null = null

function tick() {
    nowText.value = formatDateTime(new Date()) + '  ·  ' + Date.now()
}

function doAdd() {
    clearError()
    try {
        setOutput('结果: ' + dateAdd(base.value, amount.value, unit.value, op.value))
    } catch (e) {
        setError(e instanceof Error ? e.message : '计算失败')
    }
}

function doBizAdd() {
    clearError()
    try {
        setOutput('工作日结果: ' + bizDaysAdd(base.value, bizAmount.value, bizOp.value))
    } catch (e) {
        setError(e instanceof Error ? e.message : '计算失败')
    }
}

function doDiff() {
    clearError()
    try {
        setOutput('相差: ' + dateDiff(diff1.value, diff2.value, diffUnit.value))
    } catch (e) {
        setError(e instanceof Error ? e.message : '计算失败')
    }
}

function doBiz() {
    clearError()
    try {
        setOutput('工作日: ' + bizDays(diff1.value, diff2.value) + ' 天')
    } catch (e) {
        setError(e instanceof Error ? e.message : '计算失败')
    }
}

onMounted(() => {
    const t = new Date()
    const ymd = t.toISOString().slice(0, 10)
    base.value = ymd
    diff1.value = ymd
    const t2 = new Date(t)
    t2.setDate(t2.getDate() + 30)
    diff2.value = t2.toISOString().slice(0, 10)
    tick()
    timer = setInterval(tick, 1000)
    doAdd()
})
onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
})
</script>

<template>
  <UiToolShell title="日期计算器" :error="error" :dual="false">
    <template #actions>
      <UiCopyButton :text="output" />
    </template>
    <p class="now">{{ nowText }}</p>
    <div class="sec">
      <h3>加减</h3>
      <div class="row">
        <label class="field">
          <span class="lbl">基准日期</span>
          <input v-model="base" type="date" class="inp" />
        </label>
        <label class="field">
          <span class="lbl">操作</span>
          <select v-model="op" class="sel"><option value="add">加</option><option value="sub">减</option></select>
        </label>
        <label class="field">
          <span class="lbl">数量</span>
          <input v-model.number="amount" type="number" class="num" />
        </label>
        <label class="field">
          <span class="lbl">单位</span>
          <select v-model="unit" class="sel">
            <option value="day">天</option><option value="week">周</option>
            <option value="month">月</option><option value="year">年</option>
          </select>
        </label>
        <button type="button" class="btn" @click="doAdd">计算</button>
      </div>
      <div class="row biz-row">
        <label class="field">
          <span class="lbl">工作日加减</span>
          <select v-model="bizOp" class="sel"><option value="add">加</option><option value="sub">减</option></select>
        </label>
        <label class="field">
          <span class="lbl">工作日数</span>
          <input v-model.number="bizAmount" type="number" class="num" />
        </label>
        <button type="button" class="btn btn-ghost" @click="doBizAdd">工作日计算</button>
        <span class="hint">仅排除周末，不含法定节假日</span>
      </div>
    </div>
    <div class="sec">
      <h3>差值 / 工作日</h3>
      <div class="row">
        <label class="field">
          <span class="lbl">起始</span>
          <input v-model="diff1" type="date" class="inp" />
        </label>
        <label class="field">
          <span class="lbl">结束</span>
          <input v-model="diff2" type="date" class="inp" />
        </label>
        <label class="field">
          <span class="lbl">单位</span>
          <select v-model="diffUnit" class="sel">
            <option value="day">天</option><option value="week">周</option>
            <option value="month">月</option><option value="year">年</option>
          </select>
        </label>
        <button type="button" class="btn" @click="doDiff">差值</button>
        <button type="button" class="btn btn-ghost" @click="doBiz">工作日</button>
      </div>
      <p class="hint">工作日：仅排除周末，不含法定节假日</p>
    </div>
    <pre class="out">{{ output }}</pre>
  </UiToolShell>
</template>

<style scoped>
.now {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: var(--brand);
  font-family: var(--mono);
}
.sec { margin-bottom: 20px; }
.sec h3 {
  margin: 0 0 10px;
  font-size: 0.9rem;
  color: var(--text);
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 14px;
  align-items: flex-end;
}
.biz-row {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.field .lbl {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}
.row .inp,
.row .sel {
  width: auto;
  min-width: 7.5rem;
  padding: 6px 10px;
}
.row .num {
  width: 88px;
}
.out {
  margin: 0;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.9rem;
  white-space: pre-wrap;
}
</style>
