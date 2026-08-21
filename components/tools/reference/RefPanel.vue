<script setup lang="ts">
import {
  type RefGroup,
  type RefItem,
  countItems,
  itemCopyText,
  itemTitle,
} from '#shared/reference/engine'
import { loadReferenceGroups } from '#shared/reference/loaders'

const props = defineProps<{
  toolId?: string
  title?: string
  hint?: string
  placeholder?: string
}>()

const route = useRoute()
const resolvedId = computed(() => props.toolId || String(route.params.id || ''))

const q = ref('')
const loading = ref(false)
const error = ref('')
const groups = ref<RefGroup[]>([])
const activeCat = ref('')
const selectedKey = ref('')
const selected = ref<RefItem | null>(null)
const collapsed = ref<Record<string, boolean>>({})

const itemCount = computed(() => countItems(groups.value))

function itemKey(cat: string, item: RefItem, index: number) {
  return `${cat}::${itemTitle(item) || index}::${index}`
}

function itemSubtitle(item: RefItem): string {
  return String(
    item.desc ||
      item.pattern ||
      item.syntax ||
      item.example ||
      item.port ||
      item.service ||
      item.dir ||
      item.type ||
      '',
  )
}

function itemBadge(item: RefItem): string {
  if (item.codeLabel) return String(item.codeLabel)
  if (item.port) return String(item.port)
  if (item.dir) return String(item.dir)
  if (item.proto) return String(item.proto)
  if (item.type) return String(item.type)
  if (item.complexity) return String(item.complexity)
  return ''
}

function canCopyItem(item: RefItem): boolean {
  return Boolean(itemCopyText(item))
}

function selectItem(cat: string, item: RefItem, index: number) {
  selectedKey.value = itemKey(cat, item, index)
  selected.value = item
  activeCat.value = cat
}

function syncSelection(next: RefGroup[]) {
  if (!next.length) {
    selected.value = null
    selectedKey.value = ''
    activeCat.value = ''
    return
  }
  if (selectedKey.value) {
    for (const g of next) {
      const idx = (g.items || []).findIndex((it, i) => itemKey(g.cat, it, i) === selectedKey.value)
      if (idx >= 0) {
        selected.value = g.items[idx]
        activeCat.value = g.cat
        return
      }
    }
  }
  const first = next[0]
  const item = first.items?.[0]
  if (item) selectItem(first.cat, item, 0)
}

async function loadData() {
  error.value = ''
  loading.value = true
  try {
    const next = await loadReferenceGroups(resolvedId.value, q.value)
    groups.value = next
    syncSelection(next)
  } catch (e) {
    groups.value = []
    selected.value = null
    selectedKey.value = ''
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function toggleGroup(cat: string) {
  collapsed.value = { ...collapsed.value, [cat]: !collapsed.value[cat] }
}

function clearSearch() {
  q.value = ''
  loadData()
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(q, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadData()
  }, 180)
})

watch(resolvedId, () => {
  q.value = ''
  selectedKey.value = ''
  selected.value = null
  collapsed.value = {}
  loadData()
})

onMounted(() => {
  loadData()
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<template>
  <UiToolShell :title="title || '参考速查'" :error="error" :dual="false">
    <template #actions>
      <span class="ref-meta">{{ loading ? '加载中…' : `${itemCount} 条` }}</span>
    </template>

    <div class="ref-panel">
      <aside class="ref-side">
        <div class="ref-search">
          <input
            v-model="q"
            class="inp ref-search__input"
            :placeholder="placeholder || '搜索名称 / 描述 / 示例…'"
            @keyup.enter="loadData"
          />
          <button v-if="q" type="button" class="btn btn-ghost ref-search__clear" @click="clearSearch">
            清空
          </button>
        </div>
        <p class="ref-hint">{{ hint || '左侧选择条目，右侧查看详情与代码。' }}</p>

        <div v-if="loading && !groups.length" class="ref-empty">加载中…</div>
        <div v-else-if="!groups.length" class="ref-empty">无匹配结果</div>

        <div v-else class="ref-list">
          <section v-for="g in groups" :key="g.cat" class="ref-group">
            <button type="button" class="ref-group__head" @click="toggleGroup(g.cat)">
              <span class="ref-group__title">{{ g.cat }}</span>
              <span class="ref-group__count">{{ g.items.length }}</span>
              <span class="ref-group__chev" :class="{ 'is-collapsed': collapsed[g.cat] }">▾</span>
            </button>
            <ul v-show="!collapsed[g.cat]" class="ref-group__items">
              <li v-for="(item, idx) in g.items" :key="itemKey(g.cat, item, idx)">
                <button
                  type="button"
                  class="ref-item"
                  :class="{ 'is-active': selectedKey === itemKey(g.cat, item, idx) }"
                  @click="selectItem(g.cat, item, idx)"
                >
                  <span class="ref-item__main">
                    <span class="ref-item__title">{{ itemTitle(item) }}</span>
                    <span v-if="itemSubtitle(item)" class="ref-item__sub">{{ itemSubtitle(item) }}</span>
                  </span>
                  <span v-if="itemBadge(item)" class="ref-item__badge">{{ itemBadge(item) }}</span>
                </button>
              </li>
            </ul>
          </section>
        </div>
      </aside>

      <section class="ref-detail">
        <div v-if="!selected" class="ref-empty ref-empty--detail">
          {{ loading ? '加载中…' : '请选择左侧条目查看详情' }}
        </div>
        <template v-else>
          <header class="ref-detail__head">
            <div class="ref-detail__titles">
              <p v-if="activeCat" class="ref-detail__cat">{{ activeCat }}</p>
              <h3 class="ref-detail__title">{{ itemTitle(selected) }}</h3>
            </div>
            <div class="ref-detail__actions">
              <UiCopyButton
                v-if="canCopyItem(selected)"
                :text="itemCopyText(selected)"
                label="复制代码"
              />
            </div>
          </header>

          <div class="ref-detail__body">
            <div v-if="selected.desc" class="ref-field">
              <span class="ref-field__label">说明</span>
              <p class="ref-field__text">{{ selected.desc }}</p>
            </div>

            <div
              v-if="selected.dir || selected.port || selected.proto || selected.service || selected.type || selected.complexity || (selected.default != null && selected.default !== '')"
              class="ref-chips"
            >
              <span v-if="selected.dir" class="ref-chip">方向 · {{ selected.dir }}</span>
              <span v-if="selected.port" class="ref-chip">端口 · {{ selected.port }}</span>
              <span v-if="selected.proto" class="ref-chip">协议 · {{ selected.proto }}</span>
              <span v-if="selected.service" class="ref-chip">服务 · {{ selected.service }}</span>
              <span v-if="selected.type" class="ref-chip">类型 · {{ selected.type }}</span>
              <span v-if="selected.complexity" class="ref-chip">复杂度 · {{ selected.complexity }}</span>
              <span v-if="selected.default != null && selected.default !== ''" class="ref-chip">默认 · {{ selected.default }}</span>
            </div>

            <div v-if="selected.scenario" class="ref-field">
              <span class="ref-field__label">场景</span>
              <p class="ref-field__text">{{ selected.scenario }}</p>
            </div>

            <div v-if="selected.ann && selected.ann !== itemTitle(selected)" class="ref-field">
              <span class="ref-field__label">注解</span>
              <pre class="ref-code">{{ selected.ann }}</pre>
            </div>

            <div v-if="selected.method && selected.method !== itemTitle(selected)" class="ref-field">
              <span class="ref-field__label">方法</span>
              <pre class="ref-code">{{ selected.method }}</pre>
            </div>

            <div v-if="selected.key && selected.key !== itemTitle(selected)" class="ref-field">
              <span class="ref-field__label">键 / 配置</span>
              <pre class="ref-code">{{ selected.key }}</pre>
            </div>

            <div v-if="selected.arg && selected.arg !== itemTitle(selected)" class="ref-field">
              <span class="ref-field__label">参数</span>
              <pre class="ref-code">{{ selected.arg }}</pre>
            </div>

            <div v-if="selected.syntax" class="ref-field">
              <span class="ref-field__label">语法</span>
              <pre class="ref-code">{{ selected.syntax }}</pre>
            </div>

            <div v-if="selected.pattern" class="ref-field">
              <span class="ref-field__label">模式 / 扩展名</span>
              <pre class="ref-code">{{ selected.pattern }}</pre>
            </div>

            <div v-if="selected.example" class="ref-field">
              <span class="ref-field__label">示例</span>
              <pre class="ref-code">{{ selected.example }}</pre>
            </div>

            <div v-if="selected.examples?.length" class="ref-field">
              <span class="ref-field__label">示例</span>
              <ul class="ref-examples">
                <li v-for="(ex, i) in selected.examples" :key="i">
                  <code>{{ ex }}</code>
                </li>
              </ul>
            </div>

            <div v-if="selected.outputs?.length" class="ref-field">
              <span class="ref-field__label">输出</span>
              <ul class="ref-examples">
                <li v-for="(out, i) in selected.outputs" :key="i">
                  <pre class="ref-code">{{ out }}</pre>
                </li>
              </ul>
            </div>

            <div v-if="selected.returns" class="ref-field">
              <span class="ref-field__label">返回 / 属性</span>
              <p class="ref-field__text">{{ selected.returns }}</p>
            </div>

            <div v-if="selected.cmd && selected.cmd !== itemTitle(selected)" class="ref-field">
              <span class="ref-field__label">命令</span>
              <pre class="ref-code">{{ selected.cmd }}</pre>
            </div>

            <div v-if="selected.code" class="ref-field">
              <span class="ref-field__label">代码</span>
              <pre class="ref-code ref-code--block">{{ selected.code }}</pre>
            </div>

            <div v-if="selected.isDefault === true" class="ref-chip ref-chip--soft">默认</div>
          </div>
        </template>
      </section>
    </div>
  </UiToolShell>
</template>

<style scoped>
.ref-meta {
  font-size: 0.78rem;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}

.ref-panel {
  display: grid;
  grid-template-columns: minmax(240px, 0.92fr) minmax(0, 1.35fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 14px;
  align-items: stretch;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.ref-side,
.ref-detail {
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ref-search {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
  padding: 12px 12px 0;
}

.ref-search__input {
  flex: 1 1 auto;
  min-width: 0;
}

.ref-search__clear {
  flex: 0 0 auto;
  padding-inline: 10px;
}

.ref-hint {
  flex: 0 0 auto;
  margin: 8px 12px 10px;
  font-size: 0.75rem;
  color: var(--text-faint);
  line-height: 1.4;
}

.ref-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0 8px 10px;
}

.ref-group + .ref-group {
  margin-top: 6px;
}

.ref-group__head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 0;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  text-align: left;
}
.ref-group__head:hover {
  background: var(--bg-soft);
  color: var(--text);
}

.ref-group__title {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.ref-group__count {
  font-size: 0.72rem;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}

.ref-group__chev {
  font-size: 0.72rem;
  transition: transform 0.15s;
}
.ref-group__chev.is-collapsed {
  transform: rotate(-90deg);
}

.ref-group__items {
  list-style: none;
  margin: 0;
  padding: 0 0 4px;
}

.ref-item {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 9px 10px;
  margin-bottom: 2px;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  text-align: left;
  transition: background 0.12s, border-color 0.12s;
}
.ref-item:hover {
  background: var(--bg-soft);
}
.ref-item.is-active {
  background: var(--brand-soft);
  border-color: color-mix(in srgb, var(--brand) 35%, transparent);
}

.ref-item__main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ref-item__title {
  font-family: var(--mono);
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ref-item__sub {
  font-size: 0.72rem;
  color: var(--text-faint);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ref-item__badge {
  flex: 0 0 auto;
  max-width: 72px;
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--bg-soft);
  color: var(--text-muted);
  font-size: 0.68rem;
  font-family: var(--mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ref-detail__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--border);
}

.ref-detail__cat {
  margin: 0 0 4px;
  font-size: 0.72rem;
  color: var(--brand);
  font-weight: 600;
}

.ref-detail__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-strong);
  line-height: 1.35;
  word-break: break-word;
  font-family: var(--mono);
}

.ref-detail__actions {
  flex: 0 0 auto;
  display: flex;
  gap: 8px;
}

.ref-detail__body {
  flex: 1 1 auto;
  overflow: auto;
  padding: 14px 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ref-field__label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--text-faint);
  text-transform: uppercase;
}

.ref-field__text {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.ref-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ref-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-soft);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-family: var(--mono);
}

.ref-chip--soft {
  align-self: flex-start;
  color: var(--brand);
  border-color: color-mix(in srgb, var(--brand) 35%, transparent);
  background: var(--brand-soft);
}

.ref-code {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.8rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  overflow: auto;
}

.ref-code--block {
  max-height: 420px;
}

.ref-examples {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ref-examples code {
  font-size: 0.8rem;
}

.ref-empty {
  padding: 28px 16px;
  text-align: center;
  color: var(--text-faint);
  font-size: 0.86rem;
}
.ref-empty--detail {
  margin: auto;
}

@media (max-width: 900px) {
  .ref-panel {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
  }
  .ref-side,
  .ref-detail {
    height: auto;
    min-height: 240px;
  }
  .ref-side {
    max-height: 42vh;
  }
  .ref-detail {
    max-height: none;
  }
}

html[data-theme='light'] .ref-side,
html[data-theme='light'] .ref-detail {
  background: var(--bg-panel);
}
html[data-theme='light'] .ref-code {
  background: var(--bg-card-to);
}
</style>
