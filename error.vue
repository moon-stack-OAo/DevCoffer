<script lang="ts" setup>
import {absUrl, clipMeta, SITE} from '~/utils/site'

const props = defineProps<{
    error: {
        statusCode?: number
        statusMessage?: string
        message?: string
    }
}>()

const statusCode = computed(() => props.error?.statusCode || 500)
const isNotFound = computed(() => statusCode.value === 404)
const title = computed(() =>
    isNotFound.value
        ? `页面未找到 · ${SITE.name}`
        : `出错了（${statusCode.value}） · ${SITE.name}`,
)
const description = computed(() =>
    clipMeta(
        isNotFound.value
            ? `你访问的页面不存在或已移动。返回 ${SITE.brand} 首页继续使用免费开发者在线工具。`
            : `服务暂时不可用（${statusCode.value}）。请稍后重试，或返回 ${SITE.brand} 首页。`,
    ),
)

useSeoMeta({
    title: title.value,
    description: description.value,
    robots: 'noindex,nofollow',
    ogTitle: title.value,
    ogDescription: description.value,
    ogUrl: absUrl('/'),
    ogSiteName: SITE.brand,
    ogLocale: SITE.locale,
    twitterCard: 'summary_large_image',
    twitterTitle: title.value,
    twitterDescription: description.value,
})

useHead({
    title: title.value,
    htmlAttrs: { lang: SITE.lang },
    link: [{ rel: 'canonical', href: absUrl('/') }],
})

function goHome() {
    clearError({ redirect: '/' })
}
</script>

<template>
  <div class="err">
    <div class="err__card">
      <p class="err__code">{{ statusCode }}</p>
      <h1 class="err__title">{{ isNotFound ? '页面未找到' : '出错了' }}</h1>
      <p class="err__desc">
        {{
          isNotFound
            ? '链接可能已失效，或不存在该工具/分类。'
            : (error.statusMessage || error.message || '服务暂时不可用，请稍后重试。')
        }}
      </p>
      <div class="err__actions">
        <button class="err__btn" type="button" @click="goHome">返回首页</button>
        <NuxtLink class="err__link" to="/">浏览全部工具</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.err {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--bg, #0b1220);
  color: var(--text, #e2e8f0);
}
.err__card {
  width: min(520px, 100%);
  padding: 28px 24px;
  border-radius: 18px;
  border: 1px solid var(--border, rgba(148, 163, 184, 0.25));
  background: var(--bg-soft, rgba(15, 23, 42, 0.88));
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.28);
}
.err__code {
  margin: 0 0 8px;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  color: var(--brand, #38bdf8);
  font-weight: 700;
}
.err__title {
  margin: 0 0 10px;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.err__desc {
  margin: 0 0 22px;
  color: var(--text-muted, #94a3b8);
  line-height: 1.6;
}
.err__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.err__btn {
  height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  border: 0;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  color: #f8fafc;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.err__link {
  color: var(--brand, #38bdf8);
  text-decoration: none;
  font-weight: 600;
}
.err__link:hover {
  text-decoration: underline;
}
</style>
