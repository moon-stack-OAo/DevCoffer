<script setup lang="ts">
withDefaults(
    defineProps<{
        title?: string
        error?: string
        dual?: boolean
    }>(),
    {
        title: '',
        error: '',
        dual: true,
    },
)
</script>

<template>
  <section class="tool-shell">
    <header v-if="title || $slots.actions" class="tool-shell__header">
      <h2 v-if="title" class="tool-shell__title">{{ title }}</h2>
      <div class="tool-shell__actions">
        <slot name="actions" />
      </div>
    </header>

    <div v-if="error" class="tool-shell__error" role="alert">
      {{ error }}
    </div>

    <div v-if="$slots.toolbar" class="tool-shell__toolbar">
      <slot name="toolbar" />
    </div>

    <div class="tool-shell__body" :class="{ 'is-dual': dual }">
      <div v-if="dual || $slots.input" class="tool-shell__pane tool-shell__pane--input">
        <slot name="input" />
      </div>
      <div v-if="dual" class="tool-shell__pane tool-shell__pane--output">
        <slot name="output" />
      </div>
      <div v-if="!dual" class="tool-shell__single">
        <slot />
      </div>
    </div>

    <footer v-if="$slots.footer" class="tool-shell__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
.tool-shell {
  position: relative;
  background: linear-gradient(180deg, var(--bg-card-from) 0%, var(--bg-card-to) 100%);
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) + 2px);
  padding: 16px 18px 18px;
  margin-bottom: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}
.tool-shell::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(
    180deg,
    var(--cat-color, var(--brand)) 0%,
    color-mix(in srgb, var(--cat-color, var(--brand)) 35%, transparent) 100%
  );
  opacity: 0.95;
  pointer-events: none;
}
.tool-shell__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--cat-color, var(--border)) 22%, var(--border));
}
.tool-shell__title {
  margin: 0;
  font-size: 0.98rem;
  color: var(--text-strong);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.tool-shell__title::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cat-color, var(--brand));
  box-shadow: 0 0 10px var(--cat-glow, var(--brand-soft));
  flex-shrink: 0;
}
.tool-shell__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.tool-shell__actions :deep(.sel),
.tool-shell__actions :deep(.inp),
.tool-shell__actions :deep(.num) {
  width: auto;
  min-width: 0;
  padding: 6px 10px;
}
.tool-shell__error {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  color: #fecaca;
  font-size: 0.86rem;
}
.tool-shell__toolbar {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(36, 48, 68, 0.55);
}
.tool-shell__toolbar :deep(.opts),
.tool-shell__toolbar :deep(.hint),
.tool-shell__toolbar :deep(.grid2) {
  margin-bottom: 0;
}
.tool-shell__toolbar :deep(.hint) {
  margin-top: 8px;
}
.tool-shell__body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.tool-shell__body.is-dual {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
  min-height: 0;
}
@media (max-width: 900px) {
  .tool-shell__body.is-dual {
    grid-template-columns: 1fr;
  }
}
.tool-shell__pane,
.tool-shell__single {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}
.tool-shell__pane--input {
  position: relative;
}
.tool-shell__pane--input :deep(.lbl) {
  color: color-mix(in srgb, var(--cat-color, var(--text-muted)) 55%, var(--text-muted));
}
  .tool-shell__single > :deep(.ref-panel),
  .tool-shell__single > :deep(.stomp-layout),
  .tool-shell__single > :deep(.ws-layout),
  .tool-shell__single > :deep(.mqtt-layout),
  .tool-shell__single > :deep(.http-layout),
  .tool-shell__single > :deep(.mp-layout),
  .tool-shell__single > :deep(.vd-layout),
  .tool-shell__single > :deep(.grpc-layout),
  .tool-shell__single > :deep(.logfmt-layout),
  .tool-shell__single > :deep(.cssel-layout),
  .tool-shell__single > :deep(.explain-layout),
  .tool-shell__single > :deep(.sse-layout) {
  flex: 1 1 auto;
  min-height: 0;
  height: auto;
  overflow: hidden;
}
/* 仅双栏 pane 内主输入/输出自动撑满；单栏自定义布局自行控制高度 */
.tool-shell__pane :deep(.ta) {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  resize: none;
}
/* 单栏可选：给需要撑满的 textarea 加 .ta-fill */
.tool-shell__single :deep(.ta.ta-fill) {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  resize: none;
}
.tool-shell__pane :deep(.preview) {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.tool-shell__footer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(36, 48, 68, 0.85);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
