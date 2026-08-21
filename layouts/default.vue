<script setup lang="ts">
const route = useRoute()
const isToolPage = computed(() => route.path.startsWith('/t/'))
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--tool': isToolPage }">
    <div class="app-bg" aria-hidden="true" />
    <AppHeader v-if="!isToolPage" />
    <main class="app-main">
      <slot />
    </main>
    <footer v-if="!isToolPage" class="app-footer">
      <div class="app-footer__inner">
        <span>DevCoffer · 码柜</span>
        <span class="dot">·</span>
        <span>纯前端本地处理，数据不出浏览器</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  color: var(--text);
}
@media (min-width: 1101px) {
  .app-shell:has(.tool-layout),
  .app-shell--tool {
    height: 100dvh;
    max-height: 100dvh;
    overflow: hidden;
  }
}
.app-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(1000px 500px at 10% -10%, var(--bg-glow-a), transparent 55%),
    radial-gradient(800px 420px at 90% 0%, var(--bg-glow-b), transparent 50%),
    radial-gradient(600px 400px at 50% 100%, var(--bg-glow-c), transparent 55%),
    var(--bg);
}
.app-main {
  position: relative;
  z-index: 1;
  flex: 1;
  width: 100%;
  max-width: var(--max);
  margin: 0 auto;
  padding: 18px 24px 16px;
  min-height: 0;
}
.app-main:has(.tool-layout),
.app-shell--tool .app-main {
  display: flex;
  flex-direction: column;
}
@media (min-width: 1101px) {
  .app-main:has(.tool-layout),
  .app-shell--tool .app-main {
    overflow: hidden;
    padding-bottom: 12px;
  }
}
@media (min-width: 1280px) {
  .app-main:has(.tool-layout),
  .app-shell--tool .app-main {
    max-width: min(1320px, calc(100vw - 48px));
  }
}
@media (min-width: 1600px) {
  .app-main {
    max-width: min(1340px, calc(100vw - 48px));
  }
  .app-main:has(.tool-layout),
  .app-shell--tool .app-main {
    max-width: min(1440px, calc(100vw - 48px));
  }
}
.app-footer {
  position: relative;
  z-index: 1;
  border-top: 1px solid var(--border);
  background: var(--bg-footer);
}
.app-footer__inner {
  max-width: var(--max);
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--text-faint);
}
.app-footer .dot {
  opacity: 0.5;
}
</style>
