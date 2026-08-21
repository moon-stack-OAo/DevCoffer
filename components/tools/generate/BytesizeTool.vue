<script setup lang="ts">
import {
    bytesizeConvert,
    bytesizeResultText,
    bytesizeUnits,
    humanizeBytes,
} from '#shared/generate/bytesize'

const value = ref('1')
const unit = ref('GiB')
const base = ref<1000 | 1024>(1024)
const { output, error, setOutput, setError, clearError } = useToolState()

const units = computed(() => bytesizeUnits(base.value))
const rows = ref<{ unit: string; value: string }[]>([])
const human = ref('')
const bytesRaw = ref<number | null>(null)

watch(base, () => {
    const map: Record<string, string> = {
        B: 'B', KB: 'KiB', MB: 'MiB', GB: 'GiB', TB: 'TiB', PB: 'PiB',
        KiB: 'KB', MiB: 'MB', GiB: 'GB', TiB: 'TB', PiB: 'PB',
    }
    unit.value = map[unit.value] || units.value[0]!.key
})

function run() {
    clearError()
    const r = bytesizeConvert(value.value, unit.value, base.value)
    if (!r.ok) {
        setError(r.msg || '换算失败')
        rows.value = []
        human.value = ''
        bytesRaw.value = null
        setOutput('')
        return
    }
    rows.value = r.rows || []
    bytesRaw.value = r.bytes ?? null
    human.value = humanizeBytes(r.bytes!, base.value)
    setOutput(bytesizeResultText(r) + '\n\n人性化: ' + human.value)
}

function pickUnit(u: string) {
    unit.value = u
}

watch([value, unit, base], () => run(), { immediate: true })
</script>

<template>
  <UiToolShell title="字节单位换算" :error="error" :dual="false">
    <template #actions>
      <UiCopyButton :text="output" />
    </template>

    <div class="sec">
      <h3>输入</h3>
      <div class="row">
        <div class="field">
          <span class="lbl">进制</span>
          <div class="chips">
            <button
              type="button"
              class="chip"
              :class="{ active: base === 1024 }"
              @click="base = 1024"
            >IEC 1024</button>
            <button
              type="button"
              class="chip"
              :class="{ active: base === 1000 }"
              @click="base = 1000"
            >SI 1000</button>
          </div>
        </div>
        <label class="field">
          <span class="lbl">数值</span>
          <input v-model="value" class="num" />
        </label>
        <div class="field grow">
          <span class="lbl">单位</span>
          <div class="chips">
            <button
              v-for="u in units"
              :key="u.key"
              type="button"
              class="chip"
              :class="{ active: unit === u.key }"
              @click="pickUnit(u.key)"
            >{{ u.label }}</button>
          </div>
        </div>
      </div>
      <p class="hint">IEC 使用 KiB/MiB…；SI 使用 KB/MB…。切换进制会自动映射单位。</p>
    </div>

    <div class="sec">
      <h3>换算结果</h3>
      <div v-if="human" class="human">
        <span class="human-label">人性化</span>
        <span class="human-val">{{ human }}</span>
        <span v-if="bytesRaw != null" class="human-bytes">{{ bytesRaw }} bytes</span>
      </div>
      <div class="table">
        <button
          v-for="r in rows"
          :key="r.unit"
          type="button"
          class="row-item"
          :class="{ active: unit === r.unit }"
          @click="pickUnit(r.unit)"
        >
          <span class="u">{{ r.unit }}</span>
          <span class="v">{{ r.value }}</span>
        </button>
      </div>
    </div>
  </UiToolShell>
</template>

<style scoped>
.sec { margin-bottom: 18px; }
.sec h3 {
  margin: 0 0 10px;
  font-size: 0.9rem;
  color: var(--text);
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  align-items: flex-end;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.field.grow { flex: 1 1 220px; }
.field .lbl {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}
.chips { margin-bottom: 0; }
.num {
  width: 120px;
  padding: 6px 10px;
}
.hint {
  margin: 10px 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.human {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 12px;
  margin-bottom: 10px;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--brand) 35%, var(--border));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--brand) 10%, transparent);
}
.human-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.human-val {
  font-family: var(--mono);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-strong);
}
.human-bytes {
  font-family: var(--mono);
  font-size: 0.78rem;
  color: var(--text-muted);
}
.table {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}
.row-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
}
.row-item:hover {
  border-color: color-mix(in srgb, var(--brand) 45%, var(--border));
}
.row-item.active {
  border-color: var(--brand);
  background: color-mix(in srgb, var(--brand) 12%, transparent);
}
.u {
  font-size: 0.75rem;
  color: var(--brand);
  font-weight: 600;
}
.v {
  font-family: var(--mono);
  font-size: 0.92rem;
  color: var(--text-strong);
  word-break: break-all;
}
</style>
