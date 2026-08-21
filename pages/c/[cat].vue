<script setup lang="ts">
const route = useRoute()
const { getBusinessCategories, tools } = useToolsRegistry()

const catId = String(route.params.cat || '')
const businessCats = getBusinessCategories()
const cat = businessCats.find((c) => c.id === catId)

if (!cat) {
    throw createError({ statusCode: 404, statusMessage: '分类不存在' })
}

const catTools = tools.filter((t) => t.cat === cat.id)
useCategorySeo(cat, catTools)
</script>

<template>
  <div class="cat-page">
    <nav class="breadcrumb" aria-label="面包屑">
      <NuxtLink to="/">首页</NuxtLink>
      <span class="sep">›</span>
      <span>{{ cat.name }}</span>
    </nav>

    <header class="cat-hero">
      <h1 class="cat-title">
        <span class="cat-title__icon">
          <UiToolIcon :name="cat.icon" size="lg" />
        </span>
        {{ cat.name }}
      </h1>
      <p class="cat-meta">共 {{ catTools.length }} 个工具 · 纯前端本地处理 · 可用顶部搜索快速查找</p>
    </header>

    <ul v-if="catTools.length" class="tool-grid">
      <li v-for="tool in catTools" :key="tool.id">
        <UiToolCard :id="tool.id" :name="tool.name" :desc="tool.desc" :icon="tool.icon" />
      </li>
    </ul>
    <p v-else class="empty">该分类暂无工具。</p>
  </div>
</template>

<style scoped>
.cat-hero {
  margin-bottom: 22px;
}
.cat-title {
  margin: 0 0 6px;
  font-size: clamp(1.45rem, 2.5vw, 1.85rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-strong);
  display: flex;
  align-items: center;
  gap: 12px;
}
.cat-title__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-soft);
  border: 1px solid rgba(56, 189, 248, 0.28);
}
.cat-meta {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}
.empty {
  margin: 0;
  padding: 20px;
  border-radius: var(--radius);
  border: 1px dashed var(--border);
  color: var(--text-muted);
}
</style>
