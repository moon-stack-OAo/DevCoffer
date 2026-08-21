<script lang="ts" setup>
withDefaults(
    defineProps<{
        title?: string
        description?: string
        badge?: string
    }>(),
    {
        title: 'DevCoffer · 码柜',
        description: '免费纯前端开发者工具箱 · 本地处理，数据不出浏览器',
        badge: 'Developer Toolbox',
    },
)
</script>

<template>
  <div
    style="
      width: 1200px;
      height: 630px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 72px 80px;
      background: linear-gradient(135deg, #0b1220 0%, #111827 55%, #1e1b4b 100%);
      color: #f8fafc;
      font-family: 'Segoe UI', Arial, sans-serif;
    "
  >
    <div style="display: flex; align-items: center; gap: 20px;">
      <div
        style="
          width: 72px;
          height: 72px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          font-size: 28px;
          font-weight: 800;
          color: #e0f2fe;
        "
      >
        DC
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="font-size: 22px; font-weight: 700; color: #38bdf8; letter-spacing: 0.04em;">
          {{ badge }}
        </div>
        <div style="font-size: 28px; font-weight: 700; color: #94a3b8;">
          DevCoffer · 码柜
        </div>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 22px; max-width: 980px;">
      <div style="font-size: 64px; font-weight: 800; line-height: 1.15; letter-spacing: -0.03em;">
        {{ title }}
      </div>
      <div style="font-size: 30px; font-weight: 500; color: #cbd5e1; line-height: 1.4;">
        {{ description }}
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 24px; color: #64748b;">
        JSON · Base64 · Hash · UUID · YAML · SQL
      </div>
      <div style="font-size: 24px; color: #94a3b8;">
        tools.livancen.top
      </div>
    </div>
  </div>
</template>
