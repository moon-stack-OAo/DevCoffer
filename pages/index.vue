<script setup lang="ts">
const { getBusinessCategories, formatHomeSubtitle, tools } = useToolsRegistry()
useHomeSeo(tools.length)

const subtitle = formatHomeSubtitle()
const businessCats = getBusinessCategories()
const route = useRoute()

/** 每个分类卡片内预览的工具数量 */
const PREVIEW_LIMIT = 6

const catBlocks = computed(() =>
    businessCats.map((cat) => {
        const list = tools.filter((t) => t.cat === cat.id)
        return {
            ...cat,
            total: list.length,
            preview: list.slice(0, PREVIEW_LIMIT),
            more: Math.max(0, list.length - PREVIEW_LIMIT),
        }
    }),
)

const featuredIds = ['json', 'basen', 'url', 'uuid', 'yaml', 'hash'] as const
const featured = computed(() =>
    featuredIds
        .map((id) => tools.find((t) => t.id === id))
        .filter((t): t is NonNullable<typeof t> => !!t),
)

// 外链 /?q= 时跳转并聚焦顶栏搜索（由用户手动输入；此处仅提示）
const qHint = computed(() => String(route.query.q || '').trim())
</script>

<template>
  <div class="home">
    <section class="hero">
      <p class="hero-kicker">Developer Toolbox</p>
      <h1 class="hero-title">DevCoffer · 码柜</h1>
      <p class="hero-sub">{{ subtitle }}</p>
      <p class="hero-tip">按 <kbd>Ctrl</kbd> + <kbd>K</kbd> 或使用顶部搜索框快速查找工具</p>
      <p v-if="qHint" class="hero-tip">当前外链关键词：{{ qHint }}（请在顶部搜索框继续输入）</p>
    </section>

    <section class="home-section">
      <div class="section-head">
        <h2>分类</h2>
        <span class="section-meta">{{ businessCats.length }} 类</span>
      </div>
      <ul class="cat-grid">
        <li v-for="cat in catBlocks" :key="cat.id" class="cat-card">
          <NuxtLink :to="`/c/${cat.id}`" class="cat-card__head">
            <span class="cat-icon">
              <UiToolIcon :name="cat.icon" size="md" />
            </span>
            <span class="cat-body">
              <span class="cat-name">{{ cat.name }}</span>
              <span class="cat-count">{{ cat.total }} 个工具</span>
            </span>
            <span class="cat-arrow">→</span>
          </NuxtLink>
          <ul class="cat-preview">
            <li v-for="t in cat.preview" :key="t.id">
              <UiTip :text="t.desc || t.name">
                <NuxtLink :to="`/t/${t.id}`" class="cat-chip">
                  <UiToolIcon :name="t.icon" size="sm" />
                  <span>{{ t.name }}</span>
                </NuxtLink>
              </UiTip>
            </li>
            <li v-if="cat.more > 0">
              <NuxtLink :to="`/c/${cat.id}`" class="cat-chip cat-chip--more">
                +{{ cat.more }}
              </NuxtLink>
            </li>
          </ul>
        </li>
      </ul>
    </section>

    <section class="home-section">
      <div class="section-head">
        <h2>常用工具</h2>
        <span class="section-meta">快速入口</span>
      </div>
      <ul class="tool-grid">
        <li v-for="t in featured" :key="t.id">
          <UiToolCard :id="t.id" :name="t.name" :desc="t.desc" :icon="t.icon" />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.hero {
  margin-bottom: 22px;
  padding: 0;
}
.hero-kicker {
  margin: 0 0 6px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--brand);
}
.hero-title {
  margin: 0 0 8px;
  font-size: clamp(1.65rem, 2.8vw, 2.1rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-strong);
}
.hero-sub {
  margin: 0 0 8px;
  max-width: 42rem;
  color: var(--text-muted);
  font-size: 0.94rem;
}
.hero-tip {
  margin: 0;
  color: var(--text-faint);
  font-size: 0.82rem;
}
.hero-tip kbd {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 5px;
  border: 1px solid var(--border-strong);
  background: var(--bg-soft);
  font-size: 0.78rem;
  font-family: inherit;
}

.home-section {
  margin-bottom: 24px;
}
.home-section:last-child {
  margin-bottom: 0;
}
.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.section-head h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
}
.section-meta {
  font-size: 0.78rem;
  color: var(--text-faint);
}
.empty {
  margin: 0;
  padding: 20px;
  border-radius: var(--radius);
  border: 1px dashed var(--border);
  color: var(--text-muted);
  background: color-mix(in srgb, var(--bg-elevated) 50%, transparent);
}

.cat-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.cat-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: linear-gradient(180deg, var(--bg-card-from) 0%, var(--bg-card-to) 100%);
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
}
.cat-card:hover {
  border-color: color-mix(in srgb, var(--brand) 45%, transparent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
}
.cat-card__head {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text);
  text-decoration: none;
  min-width: 0;
}
.cat-card__head:hover {
  color: var(--text);
}
.cat-card__head:hover .cat-arrow {
  color: var(--brand);
  transform: translateX(2px);
}
.cat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--brand);
  background: var(--brand-soft);
  border: 1px solid color-mix(in srgb, var(--brand) 28%, transparent);
}
.cat-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}
.cat-name {
  font-weight: 650;
  font-size: 0.94rem;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cat-count {
  font-size: 0.76rem;
  color: var(--text-faint);
  line-height: 1.2;
}
.cat-arrow {
  color: var(--text-faint);
  font-size: 0.95rem;
  flex-shrink: 0;
  transition: color 0.15s, transform 0.15s;
}
.cat-preview {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.cat-preview > li {
  max-width: 100%;
  min-width: 0;
}
.cat-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  min-width: 0;
  height: 24px;
  padding: 0 8px 0 6px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg-input) 86%, transparent);
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.74rem;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.cat-chip span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cat-chip:hover {
  border-color: rgba(56, 189, 248, 0.45);
  color: var(--brand);
  background: var(--brand-soft);
}
.cat-chip--more {
  color: var(--brand);
  border-style: dashed;
  padding-left: 8px;
  padding-right: 8px;
}
</style>
