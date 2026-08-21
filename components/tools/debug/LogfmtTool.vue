<script setup lang="ts">
import {
  ALL_LEVELS,
  countByLevel,
  defaultLevelFilter,
  filterGroups,
  formatGroupsPlain,
  LOGFMT_SAMPLES,
  parseLog,
  type LevelFilter,
  type LogGroup,
  type LogLevelName,
} from '#shared/debug/logfmt'

const { input, error, setError, clearError } = useToolState(LOGFMT_SAMPLES.simple)
const levels = reactive<LevelFilter>(defaultLevelFilter())
const keyword = ref('')
const groups = ref<LogGroup[]>([])
const openStacks = ref<Set<number>>(new Set())
const statsText = ref('')

const LEVEL_CLS: Record<string, string> = {
  TRACE: 'l-trace',
  DEBUG: 'l-debug',
  INFO: 'l-info',
  WARN: 'l-warn',
  ERROR: 'l-error',
  FATAL: 'l-fatal',
}

function run() {
  clearError()
  try {
    const all = parseLog(input.value)
    const filtered = filterGroups(all, levels, keyword.value)
    groups.value = filtered
    const c = countByLevel(filtered)
    statsText.value = `共 ${filtered.length} 组 · INFO ${c.INFO} · WARN ${c.WARN} · ERROR ${c.ERROR} · FATAL ${c.FATAL}`
    openStacks.value = new Set()
  } catch (e) {
    setError(e instanceof Error ? e.message : '解析失败')
  }
}

function toggleLevel(lv: LogLevelName) {
  levels[lv] = !levels[lv]
  run()
}

function onlyError() {
  for (const lv of ALL_LEVELS) levels[lv] = lv === 'ERROR' || lv === 'FATAL'
  run()
}

function allLevels() {
  for (const lv of ALL_LEVELS) levels[lv] = true
  run()
}

function toggleStack(i: number) {
  const next = new Set(openStacks.value)
  if (next.has(i)) next.delete(i)
  else next.add(i)
  openStacks.value = next
}

function loadSample(kind: string) {
  input.value = LOGFMT_SAMPLES[kind] || ''
  run()
}

function clearAll() {
  input.value = ''
  groups.value = []
  statsText.value = ''
  clearError()
}

const plainOut = computed(() => formatGroupsPlain(groups.value))

watch(keyword, () => run())
onMounted(() => run())
</script>

<template>
  <UiToolShell title="日志格式化" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="run">格式化</button>
      <UiCopyButton :text="plainOut" label="复制结果" />
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
    </template>

    <template #toolbar>
      <div class="toolbar-row">
        <div class="level-btns">
          <button
            v-for="lv in ALL_LEVELS"
            :key="lv"
            type="button"
            class="lvl-btn"
            :class="[LEVEL_CLS[lv], { active: levels[lv] }]"
            @click="toggleLevel(lv)"
          >
            {{ lv }}
          </button>
          <button type="button" class="btn btn-ghost sm" @click="onlyError">仅 ERROR</button>
          <button type="button" class="btn btn-ghost sm" @click="allLevels">全部</button>
        </div>
        <input v-model="keyword" class="inp kw" placeholder="搜索关键词…" />
      </div>
      <div class="samples">
        <button type="button" class="btn btn-ghost sm" @click="loadSample('simple')">简单</button>
        <button type="button" class="btn btn-ghost sm" @click="loadSample('springboot')">Spring Boot</button>
        <button type="button" class="btn btn-ghost sm" @click="loadSample('error')">Error+堆栈</button>
      </div>
      <p v-if="statsText" class="stats">{{ statsText }}</p>
    </template>

    <div class="logfmt-layout">
      <div class="pane">
        <label class="lbl">原始日志</label>
        <textarea v-model="input" class="ta" rows="16" placeholder="粘贴 logback / log4j2 日志…" />
      </div>
      <div class="pane">
        <label class="lbl">高亮结果</label>
        <div v-if="!groups.length" class="empty">点击「格式化」查看高亮结果</div>
        <div v-else class="results">
          <div
            v-for="(g, i) in groups"
            :key="i"
            class="line"
            :class="g.entry ? 'level-' + g.entry.level : 'level-OTHER'"
          >
            <template v-if="g.entry">
              <span class="ts">{{ g.entry.timestamp }}</span>
              <span class="lv" :class="LEVEL_CLS[g.entry.level]">{{ g.entry.level.padEnd(5) }}</span>
              <span class="th">[{{ g.entry.thread }}]</span>
              <span class="lg">{{ g.entry.logger }}</span>
              <span class="msg">{{ g.entry.message }}</span>
            </template>
            <div
              v-if="g.frames.length"
              class="stack"
              :class="{ open: openStacks.has(i), err: g.entry?.level === 'ERROR' || g.entry?.level === 'FATAL' }"
            >
              <button type="button" class="stack-head" @click="toggleStack(i)">
                ▸ Stack Trace ({{ g.frames.length }})
              </button>
              <pre v-show="openStacks.has(i)" class="stack-body">{{ g.frames.join('\n') }}</pre>
            </div>
            <pre v-else-if="!g.entry" class="raw">{{ g.frames.join('\n') }}</pre>
          </div>
        </div>
      </div>
    </div>
  </UiToolShell>
</template>

<style scoped>
.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.level-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
.lvl-btn {
  padding: 2px 8px;
  font-size: 11px;
  font-family: var(--font-mono, ui-monospace, monospace);
  border-radius: 4px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0.45;
}
.lvl-btn.active {
  opacity: 1;
  font-weight: 700;
}
.lvl-btn.l-trace.active {
  color: #94a3b8;
  border-color: #94a3b8;
}
.lvl-btn.l-debug.active {
  color: #67e8f9;
  border-color: #67e8f9;
}
.lvl-btn.l-info.active {
  color: #34d399;
  border-color: #34d399;
}
.lvl-btn.l-warn.active {
  color: #fbbf24;
  border-color: #fbbf24;
}
.lvl-btn.l-error.active,
.lvl-btn.l-fatal.active {
  color: #f87171;
  border-color: #f87171;
}
.kw {
  width: 180px;
}
.samples {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}
.sm {
  padding: 3px 10px;
  font-size: 0.75rem;
  min-height: 28px;
}
.stats {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}
.logfmt-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
  align-self: stretch;
  height: 100%;
  width: 100%;
}
@media (max-width: 900px) {
  .logfmt-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
}
.pane {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.pane .ta,
.pane .results,
.pane .empty {
  flex: 1 1 auto;
  min-height: 0;
}
.empty {
  padding: 40px 16px;
  text-align: center;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
}
.results {
  max-height: none;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.25);
  padding: 8px;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 12px;
  line-height: 1.55;
}
.line {
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  word-break: break-word;
}
.ts {
  color: #94a3b8;
  margin-right: 6px;
}
.lv {
  font-weight: 700;
  margin-right: 6px;
}
.lv.l-info {
  color: #34d399;
}
.lv.l-debug {
  color: #67e8f9;
}
.lv.l-warn {
  color: #fbbf24;
}
.lv.l-error,
.lv.l-fatal {
  color: #f87171;
}
.lv.l-trace {
  color: #94a3b8;
}
.th {
  color: #a78bfa;
  margin-right: 6px;
}
.lg {
  color: #60a5fa;
  margin-right: 6px;
}
.msg {
  color: var(--text-strong, #e2e8f0);
}
.stack {
  margin-top: 4px;
  margin-left: 8px;
}
.stack-head {
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 11px;
  padding: 2px 0;
}
.stack.open .stack-head,
.stack.err .stack-head {
  color: #fca5a5;
}
.stack-body,
.raw {
  margin: 4px 0 0;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  white-space: pre-wrap;
  font-size: 11px;
  color: #fca5a5;
}
</style>
