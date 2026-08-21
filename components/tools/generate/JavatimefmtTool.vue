<script setup lang="ts">
import {
  javaTimeFmtFormat,
  javaTimeFmtParse,
  javaTimeFmtPatternHelp,
  javaTimeFmtPresets,
} from '#shared/generate/javatimefmt'

const NOTE = '（浏览器模拟，与 JDK 在时区/本地化上可能有差异）'

const pattern = ref('yyyy-MM-dd HH:mm:ss')
const dateInput = ref('')
const parseInput = ref('')
const offsetEnabled = ref(false)
const offsetMin = ref(480)
const helpOpen = ref(false)
const presets = javaTimeFmtPresets()
const helpRows = javaTimeFmtPatternHelp()
const { output, error, setOutput, setError, clearError } = useToolState()

function formatOpts() {
  return offsetEnabled.value ? { timezoneOffsetMin: offsetMin.value } : undefined
}

function doFormat() {
  clearError()
  const r = javaTimeFmtFormat(pattern.value, dateInput.value, formatOpts())
  if (!r.ok) {
    setError(r.msg || '格式化失败')
    return
  }
  setOutput(r.result + '\n' + NOTE)
}

function doParse() {
  clearError()
  const text = parseInput.value.trim() || dateInput.value
  const r = javaTimeFmtParse(pattern.value, text)
  if (!r.ok) {
    setError(r.msg || '解析失败')
    return
  }
  setOutput(
    [
      '解析结果: ' + r.result,
      r.msg || '',
      'year=' + r.fields.year,
      'month=' + r.fields.month,
      'day=' + r.fields.day,
      'hour=' + r.fields.hour,
      'minute=' + r.fields.minute,
      'second=' + r.fields.second,
      'ms=' + r.fields.millisecond,
      NOTE,
    ].join('\n'),
  )
}

function applyPreset(p: string) {
  pattern.value = p
  doFormat()
}

function loadSample() {
  pattern.value = 'yyyy-MM-dd HH:mm:ss'
  dateInput.value = '2026-08-03 14:05:09'
  parseInput.value = '2026-08-03 14:05:09'
  doFormat()
}

function doClear() {
  pattern.value = ''
  dateInput.value = ''
  parseInput.value = ''
  offsetEnabled.value = false
  setOutput('')
  clearError()
}

function toggleHelp() {
  helpOpen.value = !helpOpen.value
}

let formatTimer: ReturnType<typeof setTimeout> | null = null

function scheduleFormat() {
  if (formatTimer) clearTimeout(formatTimer)
  formatTimer = setTimeout(doFormat, 280)
}

watch([pattern, dateInput, offsetEnabled, offsetMin], scheduleFormat)

onBeforeUnmount(() => {
  if (formatTimer) clearTimeout(formatTimer)
})
</script>

<template>
  <UiToolShell title="Java 时间格式" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doFormat">格式化</button>
      <button type="button" class="btn btn-ghost" @click="doParse">解析</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="doClear">清空</button>
      <button type="button" class="btn btn-ghost" @click="toggleHelp">
        {{ helpOpen ? '收起字母速查' : '展开字母速查' }}
      </button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">
        浏览器模拟 DateTimeFormatter，支持 yyyy/yy、MM/M、dd/d、HH/H、hh/h、mm、ss、SSS、a、EEE/EEEE、Z/XXX；字面量用单引号包裹。
      </p>
      <div class="chips">
        <button
          v-for="p in presets"
          :key="p.pattern"
          type="button"
          class="chip"
          :title="p.desc"
          @click="applyPreset(p.pattern)"
        >
          {{ p.name }}
        </button>
      </div>
    </template>
    <template #input>
      <label class="lbl">DateTimeFormatter 模式 (pattern)</label>
      <input
        v-model="pattern"
        class="inp"
        style="width:100%;margin-bottom:8px"
        placeholder="yyyy-MM-dd HH:mm:ss"
      />
      <div class="row">
        <div class="col">
          <label class="lbl">时间输入（空=当前；ISO / yyyy-MM-dd HH:mm:ss）</label>
          <input
            v-model="dateInput"
            class="inp"
            style="width:100%"
            placeholder="2026-08-03 14:05:09"
          />
        </div>
        <div class="col">
          <label class="lbl">解析文本（可选，默认用上方时间）</label>
          <input
            v-model="parseInput"
            class="inp"
            style="width:100%"
            placeholder="2026-08-03 14:05:09"
          />
        </div>
      </div>
      <div class="opts">
        <label>
          <input v-model="offsetEnabled" type="checkbox" />
          固定时区偏移（分钟，东为正）
        </label>
        <input
          v-model.number="offsetMin"
          type="number"
          class="inp offset"
          :disabled="!offsetEnabled"
          title="如 +08:00 → 480"
        />
      </div>
      <div v-if="helpOpen" class="help">
        <table>
          <thead>
            <tr>
              <th>字母</th>
              <th>含义</th>
              <th>示例</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in helpRows" :key="h.letter">
              <td><code>{{ h.letter }}</code></td>
              <td>{{ h.meaning }}</td>
              <td>{{ h.example }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="12" readonly />
    </template>
  </UiToolShell>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}
.col {
  flex: 1;
  min-width: 200px;
}
.opts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  font-size: 0.85rem;
  color: var(--text-dim, #94a3b8);
}
.opts .offset {
  width: 100px;
}
.help {
  margin-top: 8px;
  padding: 12px;
  border-radius: 6px;
  background: var(--glass, #1e293b);
  overflow-x: auto;
}
.help table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.help th,
.help td {
  padding: 4px 8px;
  text-align: left;
}
.help th {
  color: var(--text-dim, #94a3b8);
}
.help code {
  font-family: var(--mono, ui-monospace, monospace);
}
</style>
