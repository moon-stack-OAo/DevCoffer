<script setup lang="ts">
import { convertTimestamp } from '#shared/generate/ts'

const { input, output, error, setOutput, setError, clearError } = useToolState(String(Math.floor(Date.now() / 1000)))
const direction = ref<'ts2date' | 'date2ts'>('ts2date')
const timezone = ref('Asia/Shanghai')

const TIMEZONES = [
    { value: 'UTC', label: 'UTC' },
    { value: 'Asia/Shanghai', label: '上海 (Asia/Shanghai)' },
    { value: 'Asia/Tokyo', label: '东京 (Asia/Tokyo)' },
    { value: 'America/New_York', label: '纽约 (America/New_York)' },
    { value: 'Europe/London', label: '伦敦 (Europe/London)' },
    { value: 'America/Los_Angeles', label: '洛杉矶 (America/Los_Angeles)' },
]

function run() {
    clearError()
    try {
        setOutput(convertTimestamp(input.value, direction.value, timezone.value))
    } catch (e) {
        setError(e instanceof Error ? e.message : '转换失败')
    }
}

function fillNow() {
    input.value = String(Date.now())
    direction.value = 'ts2date'
    run()
}

onMounted(() => run())
</script>

<template>
  <UiToolShell title="时间戳转换" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">转换</button>
      <button type="button" class="btn btn-ghost" @click="fillNow">现在</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>方向
          <select v-model="direction" class="sel" @change="run">
            <option value="ts2date">时间戳 → 日期</option>
            <option value="date2ts">日期 → 时间戳</option>
          </select>
        </label>
        <label>时区
          <select v-model="timezone" class="sel" @change="run">
            <option v-for="z in TIMEZONES" :key="z.value" :value="z.value">{{ z.label }}</option>
          </select>
        </label>
      </div>
      <p v-if="direction === 'date2ts'" class="hint">
        日期→时间戳：无时区后缀时按浏览器本地时区解析；带 Z / ±offset 则按 UTC 或显式偏移解析。下方时区仅用于结果展示。
      </p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="10" placeholder="1710000000 或 2024-01-01T12:00:00" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="10" readonly />
    </template>
  </UiToolShell>
</template>
