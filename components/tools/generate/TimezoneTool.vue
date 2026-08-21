<script setup lang="ts">
import {
    convertTimezone,
    getLocalTimeZone,
    TZ_COMMON,
} from '#shared/generate/timezone'

const local = getLocalTimeZone()
const zones = computed(() => {
    const list = [local, ...TZ_COMMON.filter((z) => z !== local)]
    return [...new Set(list)]
})
const sourceZone = ref(local)
const targetZone = ref('UTC')
const customSrc = ref('')
const customTgt = ref('')
const localTime = ref('')
const { output, error, setOutput, setError, clearError } = useToolState()

function pad(n: number) {
    return String(n).padStart(2, '0')
}

function fillNow() {
    const d = new Date()
    localTime.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function run() {
    clearError()
    try {
        const src = customSrc.value.trim() || sourceZone.value
        const tgt = customTgt.value.trim() || targetZone.value
        setOutput(convertTimezone(localTime.value, src, tgt))
    } catch (e) {
        setError(e instanceof Error ? e.message : '转换失败')
    }
}

watch([localTime, sourceZone, targetZone, customSrc, customTgt], run)

onMounted(() => {
    fillNow()
    run()
})
</script>

<template>
  <UiToolShell title="时区转换" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="fillNow(); run()">现在</button>
      <button type="button" class="btn" @click="run">转换</button>
      <UiCopyButton :text="output" />
    </template>
    <label class="lbl">源时区墙钟时间</label>
    <input v-model="localTime" class="inp" placeholder="2024-01-01T12:00:00" />
    <div class="row">
      <label class="lbl">源时区
        <select v-model="sourceZone" class="sel">
          <option v-for="z in zones" :key="z" :value="z">{{ z }}</option>
        </select>
        <input v-model="customSrc" class="inp sm" placeholder="自定义覆盖…" />
      </label>
      <label class="lbl">目标时区
        <select v-model="targetZone" class="sel">
          <option v-for="z in zones" :key="'t'+z" :value="z">{{ z }}</option>
        </select>
        <input v-model="customTgt" class="inp sm" placeholder="自定义覆盖…" />
      </label>
    </div>
    <pre class="out">{{ output }}</pre>
  </UiToolShell>
</template>

<style scoped>
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 720px) { .row { grid-template-columns: 1fr; } }

.inp.sm { margin-top: 6px; }
.out {
  margin: 12px 0 0;
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
