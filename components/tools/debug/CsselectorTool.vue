<script setup lang="ts">
import {
  CSSELECTOR_SAMPLES,
  explainCssSelectorResult,
  queryCssSelector,
  sanitizePreviewHtml,
  type CssExplainResult,
  type CssQueryResult,
} from '#shared/debug/csselector'

const mode = ref<'query' | 'explain'>('query')
const html = ref(CSSELECTOR_SAMPLES.basic.html)
const selector = ref(CSSELECTOR_SAMPLES.basic.selector)
const { error, setError, clearError } = useToolState()

const queryResult = ref<CssQueryResult | null>(null)
const explainResult = ref<CssExplainResult | null>(null)
const previewEl = ref<HTMLElement | null>(null)

const openSel = ref(true)
const openHtml = ref(true)
const openMatches = ref(true)

const showTipsCard = computed(
  () => mode.value === 'explain' && (explainResult.value?.tips.length ?? 0) > 0,
)

function toggleCard(key: 'sel' | 'html' | 'matches') {
  if (key === 'sel') openSel.value = !openSel.value
  else if (key === 'html') openHtml.value = !openHtml.value
  else openMatches.value = !openMatches.value
}

const plainOut = computed(() => {
  if (mode.value === 'explain') return explainResult.value?.text || ''
  return queryResult.value?.text || ''
})

const matchCount = computed(() => queryResult.value?.count ?? 0)
const hasRun = computed(() =>
  mode.value === 'explain' ? !!explainResult.value : queryResult.value != null,
)
const previewHtml = computed(() => sanitizePreviewHtml(html.value))

function runQuery() {
  clearError()
  const r = queryCssSelector(html.value, selector.value)
  queryResult.value = r
  if (!r.ok) {
    setError(r.msg || '查询失败')
  }
}

function runExplain() {
  clearError()
  explainResult.value = explainCssSelectorResult(selector.value)
}

function run() {
  if (mode.value === 'explain') runExplain()
  else runQuery()
}

function applyPreviewHighlight() {
  const el = previewEl.value
  if (!el) return
  el.querySelectorAll('.cssel-hl').forEach((n) => n.classList.remove('cssel-hl'))
  const sel = selector.value.trim()
  if (!sel || !queryResult.value?.ok) return
  try {
    el.querySelectorAll(sel).forEach((n) => n.classList.add('cssel-hl'))
  } catch {
    /* invalid selector already handled */
  }
}

function loadSample(key: keyof typeof CSSELECTOR_SAMPLES) {
  const s = CSSELECTOR_SAMPLES[key]
  mode.value = 'query'
  html.value = s.html
  selector.value = s.selector
}

function clearAll() {
  if (mode.value === 'query') {
    html.value = ''
    selector.value = ''
    queryResult.value = null
  } else {
    selector.value = ''
    explainResult.value = null
  }
  clearError()
}

function onModeChange() {
  clearError()
  run()
}

watch(mode, onModeChange)
watch([html, selector], () => {
  if (mode.value === 'query') {
    runQuery()
  } else {
    runExplain()
  }
})
watch([previewHtml, queryResult], () => {
  if (mode.value !== 'query') return
  nextTick(() => applyPreviewHighlight())
})

onMounted(() => run())
</script>

<template>
  <UiToolShell title="CSS 选择器" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="run">执行</button>
      <UiCopyButton :text="plainOut" />
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
    </template>

    <template #toolbar>
      <div class="toolbar-row">
        <div class="mode-seg" role="tablist" aria-label="模式">
          <button
            type="button"
            class="mode-seg-btn"
            role="tab"
            :aria-selected="mode === 'query'"
            :class="{ active: mode === 'query' }"
            @click="mode = 'query'"
          >
            HTML 查询
          </button>
          <button
            type="button"
            class="mode-seg-btn"
            role="tab"
            :aria-selected="mode === 'explain'"
            :class="{ active: mode === 'explain' }"
            @click="mode = 'explain'"
          >
            速查说明
          </button>
        </div>
        <div v-if="mode === 'query'" class="samples">
          <button type="button" class="btn btn-ghost sm" @click="loadSample('basic')">基础</button>
          <button type="button" class="btn btn-ghost sm" @click="loadSample('list')">列表</button>
          <button type="button" class="btn btn-ghost sm" @click="loadSample('form')">表单</button>
        </div>
      </div>
    </template>

    <div v-if="mode === 'query'" class="cssel-layout">
      <div class="cssel-main">
        <div class="cssel-card" :class="{ collapsed: !openSel }">
          <button
            type="button"
            class="cssel-card-head cssel-card-toggle"
            :aria-expanded="openSel"
            @click="toggleCard('sel')"
          >
            <span class="cssel-card-title">
              <span class="cssel-chevron" aria-hidden="true">{{ openSel ? '▾' : '▸' }}</span>
              选择器
            </span>
            <span
              class="cssel-count"
              :class="{ 'has-match': matchCount > 0, 'is-zero': hasRun && matchCount === 0 }"
            >
              {{ hasRun ? matchCount : '—' }}
            </span>
          </button>
          <div v-show="openSel" class="cssel-card-body">
            <div class="cssel-sel-row">
              <input
                v-model="selector"
                class="inp cssel-sel-input"
                placeholder="div.card > .title"
                @keydown.enter.prevent="run"
              />
            </div>
          </div>
        </div>

        <div class="cssel-card" :class="{ collapsed: !openHtml }">
          <button
            type="button"
            class="cssel-card-head cssel-card-toggle"
            :aria-expanded="openHtml"
            @click="toggleCard('html')"
          >
            <span class="cssel-card-title">
              <span class="cssel-chevron" aria-hidden="true">{{ openHtml ? '▾' : '▸' }}</span>
              样例 HTML
            </span>
          </button>
          <div v-show="openHtml" class="cssel-card-body">
            <textarea
              v-model="html"
              class="ta cssel-html"
              spellcheck="false"
              placeholder="粘贴要测试的 HTML 片段…"
            />
          </div>
        </div>

        <div class="cssel-card cssel-card-matches" :class="{ collapsed: !openMatches }">
          <button
            type="button"
            class="cssel-card-head cssel-card-toggle"
            :aria-expanded="openMatches"
            @click="toggleCard('matches')"
          >
            <span class="cssel-card-title">
              <span class="cssel-chevron" aria-hidden="true">{{ openMatches ? '▾' : '▸' }}</span>
              匹配结果
            </span>
            <span v-if="queryResult?.truncated" class="cssel-badge">仅展示前 50</span>
          </button>
          <div v-show="openMatches" class="cssel-card-body cssel-card-body-fill">
            <div v-if="!queryResult" class="cssel-empty">输入选择器与 HTML 后自动查询</div>
            <div v-else-if="!queryResult.ok" class="cssel-error">{{ queryResult.msg }}</div>
            <div v-else-if="!queryResult.matches.length" class="cssel-empty">无匹配元素</div>
            <div v-else class="cssel-matches">
              <div
                v-for="(m, i) in queryResult.matches"
                :key="i"
                class="cssel-match-item"
              >
                <span class="cssel-match-idx">#{{ i + 1 }}</span>
                <pre class="cssel-match-code">{{ m }}</pre>
              </div>
              <div v-if="queryResult.truncated" class="cssel-match-more">
                共 {{ queryResult.count }} 个，仅展示前 {{ queryResult.matches.length }} 个
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="cssel-side">
        <div class="cssel-card cssel-card-preview">
          <div class="cssel-card-head">
            <span class="cssel-card-title">预览</span>
            <span class="cssel-badge">命中高亮</span>
          </div>
          <div class="cssel-preview">
            <div ref="previewEl" class="cssel-preview-inner" v-html="previewHtml" />
          </div>
        </div>
        <div class="cssel-hint">
          <div class="cssel-hint-item">使用浏览器 <code>querySelectorAll</code> 本地匹配</div>
          <div class="cssel-hint-item">右侧预览会给命中元素加橙色高亮轮廓</div>
          <div class="cssel-hint-item">样例中的 <code>&lt;script&gt;</code> 会被移除以防执行</div>
        </div>
      </div>
    </div>

    <div v-else class="explain-layout">
      <div class="cssel-card explain-sel-card">
        <div class="cssel-card-head">
          <span class="cssel-card-title">选择器</span>
          <span class="cssel-badge">可留空浏览速查</span>
        </div>
        <input
          v-model="selector"
          class="inp cssel-sel-input"
          placeholder="例如：.card > .title:nth-child(2)"
        />
      </div>

      <div v-if="showTipsCard" class="cssel-card tips-card">
        <div class="cssel-card-head">
          <span class="cssel-card-title">提示</span>
        </div>
        <ul v-if="explainResult?.tips.length" class="tips-list">
          <li v-for="(t, i) in explainResult.tips" :key="i">{{ t }}</li>
        </ul>
        <p v-else class="tips-empty">输入选择器后，这里会显示针对性说明。</p>
      </div>

      <div class="cssel-card explain-notes-card">
        <div class="cssel-card-head">
          <span class="cssel-card-title">速查表</span>
          <span class="notes-count">{{ explainResult?.notes?.length || 0 }} 项</span>
        </div>
        <div class="notes-table">
          <div v-for="n in explainResult?.notes || []" :key="n.sel" class="notes-row">
            <code class="notes-sel">{{ n.sel }}</code>
            <span class="notes-desc">{{ n.desc }}</span>
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
  justify-content: space-between;
}
.mode-seg {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  padding: 3px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg-input, var(--bg-card2)) 70%, transparent);
}
.mode-seg-btn {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: 12.5px;
  line-height: 1.2;
  padding: 6px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.mode-seg-btn:hover {
  color: var(--text-strong, var(--text));
}
.mode-seg-btn.active {
  background: color-mix(in srgb, var(--accent, #63b3ed) 20%, transparent);
  color: var(--text-strong, var(--text));
  font-weight: 600;
}
.samples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.sm {
  padding: 2px 8px;
  font-size: 0.75rem;
  min-height: 26px;
}
.explain-layout {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-height: 0;
  height: 100%;
}
.explain-notes-card {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.tips-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
}
.tips-empty {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}
.notes-count {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
}
.notes-table {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1 1 auto;
  min-height: 220px;
  max-height: min(62vh, 560px);
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-input, var(--bg-soft));
  padding: 4px;
}
.notes-row {
  display: grid;
  grid-template-columns: minmax(140px, 0.85fr) minmax(0, 1.15fr);
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  align-items: baseline;
}
.notes-row:hover {
  background: color-mix(in srgb, var(--accent, #63b3ed) 8%, transparent);
}
.notes-sel {
  font-size: 12px;
  font-family: var(--font-mono, ui-monospace, monospace);
  color: var(--accent, var(--brand));
}
.notes-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.45;
}
@media (max-width: 560px) {
  .notes-row {
    grid-template-columns: 1fr;
    gap: 2px;
  }
  .toolbar-row {
    align-items: stretch;
  }
  .mode-seg {
    width: 100%;
  }
  .mode-seg-btn {
    flex: 1;
  }
}
</style>
