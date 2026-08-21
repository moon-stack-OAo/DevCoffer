<script setup lang="ts">
import { PRESETS, cubicBezierCss } from '#shared/generate/cubicbezier'
const x1 = ref(0.25), y1 = ref(0.1), x2 = ref(0.25), y2 = ref(1)
const duration = ref(1)
const moved = ref(false)
const { output, error, setOutput, clearError } = useToolState()
const W = 200, H = 120, PAD = 16
function toXy(x: number, y: number) {
  return [PAD + x * (W - PAD * 2), PAD + (1 - y) * (H - PAD * 2)] as const
}
const curveD = computed(() => {
  const [p0x, p0y] = toXy(0, 0)
  const [p1x, p1y] = toXy(x1.value, y1.value)
  const [p2x, p2y] = toXy(x2.value, y2.value)
  const [p3x, p3y] = toXy(1, 1)
  return `M ${p0x} ${p0y} C ${p1x} ${p1y}, ${p2x} ${p2y}, ${p3x} ${p3y}`
})
const handles = computed(() => ({
  p0: toXy(0, 0),
  p1: toXy(x1.value, y1.value),
  p2: toXy(x2.value, y2.value),
  p3: toXy(1, 1),
}))
const timing = computed(() => output.value.replace('transition-timing-function:', '').replace(';', '').trim())
function run() { clearError(); setOutput(cubicBezierCss(x1.value, y1.value, x2.value, y2.value)) }
function apply(name: string) {
  const p = PRESETS[name]; if (!p) return
  x1.value = p[0]; y1.value = p[1]; x2.value = p[2]; y2.value = p[3]; run()
}
function toggle() { moved.value = !moved.value }
watch([x1, y1, x2, y2], () => run(), { immediate: true })
</script>
<template>
  <UiToolShell title="贝塞尔曲线" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <button v-for="k in Object.keys(PRESETS)" :key="k" type="button" class="btn btn-ghost" @click="apply(k)">{{ k }}</button>
      </div>
      <div class="grid2" style="margin-top:10px">
        <label class="lbl">x1 <input v-model.number="x1" type="number" step="0.01" min="0" max="1" class="inp" /></label>
        <label class="lbl">y1 <input v-model.number="y1" type="number" step="0.01" class="inp" /></label>
        <label class="lbl">x2 <input v-model.number="x2" type="number" step="0.01" min="0" max="1" class="inp" /></label>
        <label class="lbl">y2 <input v-model.number="y2" type="number" step="0.01" class="inp" /></label>
        <label class="lbl">时长 duration (s) <input v-model.number="duration" type="number" step="0.1" min="0.3" max="2" class="inp" /></label>
      </div>
    </template>
    <template #input>
      <label class="lbl">曲线</label>
      <div class="preview curve-box">
        <svg :viewBox="`0 0 ${W} ${H}`" class="curve" aria-hidden="true">
          <line :x1="handles.p0[0]" :y1="handles.p0[1]" :x2="handles.p1[0]" :y2="handles.p1[1]" class="handle-line" />
          <line :x1="handles.p3[0]" :y1="handles.p3[1]" :x2="handles.p2[0]" :y2="handles.p2[1]" class="handle-line" />
          <path :d="curveD" class="curve-path" fill="none" />
          <circle v-for="(p, i) in [handles.p0, handles.p1, handles.p2, handles.p3]" :key="i" :cx="p[0]" :cy="p[1]" r="3.5" class="dot" />
        </svg>
      </div>
      <label class="lbl" style="margin-top:10px">动画预览（点击切换）</label>
      <div class="preview anim-box" @click="toggle">
        <div
          class="mover"
          :class="{ moved }"
          :style="{ transition: `transform ${duration}s ${timing}` }"
        >
          <div class="box" :style="{ transition: `transform ${duration}s ${timing}` }">点击动画</div>
        </div>
      </div>
    </template>
    <template #output>
      <label class="lbl">CSS</label>
      <textarea :value="output" class="ta" rows="6" readonly />
    </template>
  </UiToolShell>
</template>
<style scoped>
.preview.curve-box,
.preview.anim-box {
  flex: 0 0 auto;
  min-height: 0;
  padding: 10px;
  justify-content: flex-start;
}
.curve {
  width: 100%;
  max-width: 280px;
  height: auto;
  display: block;
  background: var(--bg-input);
  border-radius: var(--radius-xs);
}
.curve-path {
  stroke: var(--brand);
  stroke-width: 2.5;
}
.handle-line {
  stroke: var(--text-muted, #94a3b8);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}
.dot { fill: var(--brand-strong, #0369a1); }
.anim-box {
  height: 48px;
  overflow: hidden;
  cursor: pointer;
}
.mover {
  width: 100%;
  transform: translateX(0);
}
.mover.moved { transform: translateX(100%); }
.mover.moved .box { transform: translateX(-100%); }
.box {
  width: 100px;
  max-width: 40%;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brand);
  color: #0b1220;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  transform: translateX(0);
}
</style>
