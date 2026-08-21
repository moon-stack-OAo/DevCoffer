<script setup lang="ts">
const { tools } = useToolsRegistry()
const { ready, favorites, recent } = useToolHistory()
const { isDark, toggleTheme } = useTheme()

const route = useRoute()
const q = ref('')
const open = ref(false)
const active = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
let skipRouteSync = false

const results = computed(() => {
    const key = q.value.trim().toLowerCase()
    if (!key) return []
    return tools
        .filter(
            (t) =>
                t.id.includes(key) ||
                t.name.toLowerCase().includes(key) ||
                (t.desc || '').toLowerCase().includes(key) ||
                (t.tags || []).some((tag) => tag.toLowerCase().includes(key)),
        )
        .slice(0, 10)
})

watch(results, () => {
    active.value = 0
})

watch(
    () => String(route.query.q || ''),
    (val: string) => {
        if (skipRouteSync) return
        const next = val.trim()
        if (!next) return
        q.value = next
        open.value = true
        nextTick(() => inputRef.value?.focus())
    },
    { immediate: true },
)

function focusSearch() {
    open.value = true
    nextTick(() => inputRef.value?.focus())
}

async function closePanel() {
    open.value = false
    q.value = ''
    active.value = 0
    if (route.query.q) {
        skipRouteSync = true
        const query = { ...route.query }
        delete query.q
        try {
            await navigateTo({ path: route.path, query }, { replace: true })
        } finally {
            skipRouteSync = false
        }
    }
}

function goTool(id: string) {
    closePanel()
    navigateTo(`/t/${id}`)
}

function onKeydown(e: KeyboardEvent) {
    const mod = e.ctrlKey || e.metaKey
    if (mod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        focusSearch()
        return
    }
    if (!open.value) return
    if (e.key === 'Escape') {
        e.preventDefault()
        closePanel()
        inputRef.value?.blur()
        return
    }
    if (!results.value.length) return
    if (e.key === 'ArrowDown') {
        e.preventDefault()
        active.value = (active.value + 1) % results.value.length
    } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        active.value = (active.value - 1 + results.value.length) % results.value.length
    } else if (e.key === 'Enter') {
        e.preventDefault()
        const hit = results.value[active.value]
        if (hit) goTool(hit.id)
    }
}

function onDocClick(e: MouseEvent) {
    const el = e.target as HTMLElement
    if (open.value) {
        if (!el.closest?.('.hdr-search')) open.value = false
    }
    if (showFav.value && !el.closest?.('.hdr-menu')) showFav.value = false
    if (showRecent.value && !el.closest?.('.hdr-menu')) showRecent.value = false
}

/** 下拉/搜索面板内滚动时，阻止滚轮穿透到页面 */
function onPanelWheel(e: WheelEvent) {
    const panel = e.currentTarget as HTMLElement | null
    if (!panel) return
    e.stopPropagation()
    const atTop = panel.scrollTop <= 0
    const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 1
    if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
        e.preventDefault()
    }
}

onMounted(() => {
    window.addEventListener('keydown', onKeydown)
    document.addEventListener('click', onDocClick)
})
onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
    document.removeEventListener('click', onDocClick)
})

const showFav = ref(false)
const showRecent = ref(false)

function openFav() {
    showRecent.value = false
    showFav.value = !showFav.value
}
function openRecent() {
    showFav.value = false
    showRecent.value = !showRecent.value
}
</script>

<template>
  <header class="hdr">
    <div class="hdr__inner">
      <NuxtLink to="/" class="hdr-brand" @click="closePanel">
        <span class="hdr-brand__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" />
            <path d="M3.5 10h17" />
            <path d="M12 4.5v15" />
            <path d="M8.2 13.2h1.8" />
            <path d="M14 13.2h1.8" />
          </svg>
        </span>
        <span class="hdr-brand__text">
          <span class="hdr-brand__name">DevCoffer</span>
          <span class="hdr-brand__sub">码柜 · 开发者工具箱</span>
        </span>
      </NuxtLink>

      <div class="hdr-search" ref="panelRef">
        <label class="hdr-search__box" :class="{ 'is-open': open || q }">
          <svg class="hdr-search__icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" stroke-linecap="round" />
          </svg>
          <input
            ref="inputRef"
            v-model="q"
            class="hdr-search__input"
            type="search"
            placeholder="搜索工具…"
            autocomplete="off"
            @focus="open = true"
            @input="open = true"
          >
          <kbd class="hdr-search__kbd">Ctrl K</kbd>
        </label>

        <div
          v-if="open && (q.trim() || results.length)"
          class="hdr-search__panel"
          @wheel="onPanelWheel"
        >
          <template v-if="results.length">
            <button
              v-for="(t, i) in results"
              :key="t.id"
              type="button"
              class="hdr-search__item"
              :class="{ 'is-active': i === active }"
              @mouseenter="active = i"
              @click="goTool(t.id)"
            >
              <span class="hdr-search__item-icon">
                <UiToolIcon :name="t.icon" size="sm" />
              </span>
              <span class="hdr-search__item-body">
                <span class="hdr-search__item-name">{{ t.name }}</span>
                <span v-if="t.desc" class="hdr-search__item-desc">{{ t.desc }}</span>
              </span>
              <code class="hdr-search__item-id">{{ t.id }}</code>
            </button>
          </template>
          <p v-else-if="q.trim()" class="hdr-search__empty">未找到匹配工具</p>
        </div>
      </div>

      <div class="hdr-actions">
        <button
          type="button"
          class="hdr-btn hdr-theme"
          :aria-label="isDark ? '切换到浅色主题' : '切换到深色主题'"
          :title="isDark ? '切换到浅色' : '切换到深色'"
          @click="toggleTheme"
        >
          <svg v-if="isDark" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke-linecap="round" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" stroke-linejoin="round" />
          </svg>
        </button>

        <div class="hdr-menu">
          <button type="button" class="hdr-btn" :class="{ 'is-on': showFav }" @click="openFav">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17.8 6.6 20l1-6.1L3.2 9.4l6.1-.9L12 3z" stroke-linejoin="round" />
            </svg>
            <span>收藏</span>
            <span v-if="ready && favorites.length" class="hdr-btn__count">{{ favorites.length }}</span>
          </button>
          <div v-if="showFav" class="hdr-dropdown" @wheel="onPanelWheel">
            <p v-if="!favorites.length" class="hdr-dropdown__empty">暂无收藏，在工具页点星标添加</p>
            <UiTip v-for="t in favorites" :key="t.id" :text="t.desc || t.name" block>
              <NuxtLink
                :to="`/t/${t.id}`"
                class="hdr-dropdown__item"
                @click="showFav = false"
              >
                <UiToolIcon :name="t.icon" size="sm" />
                <span>{{ t.name }}</span>
              </NuxtLink>
            </UiTip>
          </div>
        </div>

        <div class="hdr-menu">
          <button type="button" class="hdr-btn" :class="{ 'is-on': showRecent }" @click="openRecent">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v5l3 2" stroke-linecap="round" />
            </svg>
            <span>最近</span>
          </button>
          <div v-if="showRecent" class="hdr-dropdown hdr-dropdown--right" @wheel="onPanelWheel">
            <p v-if="!recent.length" class="hdr-dropdown__empty">暂无最近使用记录</p>
            <UiTip v-for="t in recent" :key="t.id" :text="t.desc || t.name" block>
              <NuxtLink
                :to="`/t/${t.id}`"
                class="hdr-dropdown__item"
                @click="showRecent = false"
              >
                <UiToolIcon :name="t.icon" size="sm" />
                <span>{{ t.name }}</span>
              </NuxtLink>
            </UiTip>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hdr {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(16px);
  background: var(--bg-header);
  border-bottom: 1px solid var(--border);
}
.hdr__inner {
  max-width: var(--max);
  margin: 0 auto;
  padding: 0 24px;
  min-height: 58px;
  display: grid;
  grid-template-columns: auto minmax(180px, 1fr) auto;
  align-items: center;
  gap: 14px;
}
@media (min-width: 1600px) {
  .hdr__inner {
    max-width: min(1340px, calc(100vw - 48px));
  }
}

.hdr-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  text-decoration: none;
  min-width: 0;
}
.hdr-brand:hover {
  color: var(--text);
}
.hdr-brand__mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  color: #e0f2fe;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  box-shadow: 0 6px 18px rgba(14, 165, 233, 0.32);
  flex-shrink: 0;
}
.hdr-brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  min-width: 0;
}
.hdr-brand__name {
  font-weight: 750;
  font-size: 0.98rem;
}
.hdr-brand__sub {
  font-size: 0.7rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.hdr-search {
  position: relative;
  width: 100%;
  max-width: 520px;
  justify-self: center;
}
.hdr-search__box {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 10px 0 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-input);
  transition: border-color 0.15s, box-shadow 0.15s;
  cursor: text;
}
.hdr-search__box.is-open,
.hdr-search__box:focus-within {
  border-color: rgba(56, 189, 248, 0.55);
  box-shadow: 0 0 0 3px var(--brand-soft);
}
.hdr-search__icon {
  color: var(--text-faint);
  font-size: 0.9rem;
}
.hdr-search__input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text);
  font-size: 0.9rem;
  font-family: inherit;
}
.hdr-search__input::placeholder {
  color: var(--text-faint);
}
.hdr-search__kbd {
  flex-shrink: 0;
  padding: 2px 7px;
  border-radius: 6px;
  border: 1px solid var(--border-strong);
  background: var(--bg-soft);
  color: var(--text-muted);
  font-size: 0.68rem;
  font-family: inherit;
  line-height: 1.4;
}

.hdr-search__panel {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 8px);
  max-height: min(420px, 70vh);
  overflow: auto;
  overscroll-behavior: contain;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-dropdown);
  box-shadow: var(--shadow);
  padding: 6px;
  z-index: 60;
}
.hdr-search__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  font-family: inherit;
}
.hdr-search__item.is-active,
.hdr-search__item:hover {
  background: var(--brand-soft);
}
.hdr-search__item-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  flex-shrink: 0;
}
.hdr-search__item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.hdr-search__item-name {
  font-size: 0.9rem;
  font-weight: 600;
}
.hdr-search__item-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hdr-search__item-id {
  font-size: 0.7rem;
  color: var(--text-faint);
  background: transparent;
  padding: 0;
}
.hdr-search__empty {
  margin: 0;
  padding: 14px 12px;
  color: var(--text-muted);
  font-size: 0.86rem;
}

.hdr-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hdr-menu {
  position: relative;
}
.hdr-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 11px;
  border-radius: 9px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.86rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.hdr-btn:hover,
.hdr-btn.is-on {
  color: var(--brand);
  background: var(--brand-soft);
  border-color: color-mix(in srgb, var(--brand) 22%, transparent);
}
.hdr-theme {
  width: 36px;
  padding: 0;
  justify-content: center;
}
.hdr-btn__count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.7rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.hdr-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 248px;
  max-height: min(360px, 70vh);
  overflow: auto;
  overscroll-behavior: contain;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-dropdown);
  box-shadow: var(--shadow);
  z-index: 60;
}
.hdr-dropdown__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--text);
  text-decoration: none;
  font-size: 0.86rem;
}
.hdr-dropdown__item:hover {
  background: var(--brand-soft);
  color: var(--text);
}
.hdr-dropdown__empty {
  margin: 0;
  padding: 12px 10px;
  color: var(--text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

@media (max-width: 720px) {
  .hdr__inner {
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    padding: 8px 12px;
    gap: 8px;
  }
  .hdr-brand {
    grid-column: 1;
  }
  .hdr-actions {
    grid-column: 2;
    justify-self: end;
  }
  .hdr-search {
    grid-column: 1 / -1;
    max-width: none;
    justify-self: stretch;
  }
  .hdr-brand__sub {
    display: none;
  }
  .hdr-btn span:not(.hdr-btn__count) {
    display: none;
  }
  .hdr-search__kbd {
    display: none;
  }
}
</style>
