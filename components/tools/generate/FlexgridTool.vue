<script setup lang="ts">
import { flexCss, gridCss } from '#shared/generate/flexgrid'
const mode = ref<'flex'|'grid'>('flex')
const direction = ref('row'), justify = ref('flex-start'), align = ref('center'), gap = ref(8), wrap = ref(true)
const cols = ref(3), rows = ref(2), items = ref(4)
const justifyItems = ref('stretch'), alignItems = ref('stretch')
const { output, error, setOutput, clearError } = useToolState()
const cellCount = computed(() => {
  if (mode.value === 'grid') return Math.max(1, Math.min(48, cols.value * rows.value))
  return Math.max(1, Math.min(24, items.value))
})
function run() {
  clearError()
  setOutput(mode.value === 'flex'
    ? flexCss({ direction: direction.value, justify: justify.value, align: align.value, gap: gap.value, wrap: wrap.value })
    : gridCss(cols.value, rows.value, gap.value, justifyItems.value, alignItems.value))
}
run()
</script>
<template>
  <UiToolShell title="Flex / Grid 可视化" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>模式
          <select v-model="mode" class="sel" @change="run">
            <option value="flex">flex</option>
            <option value="grid">grid</option>
          </select>
        </label>
        <label>间距 gap <input v-model.number="gap" type="number" class="num" @change="run" /></label>
        <template v-if="mode==='flex'">
          <label>主轴方向 flex-direction
            <select v-model="direction" class="sel" @change="run">
              <option>row</option><option>column</option>
            </select>
          </label>
          <label>主轴对齐 justify-content
            <select v-model="justify" class="sel" @change="run">
              <option>flex-start</option>
              <option>flex-end</option>
              <option>center</option>
              <option>space-between</option>
              <option>space-around</option>
              <option>space-evenly</option>
            </select>
          </label>
          <label>交叉轴对齐 align-items
            <select v-model="align" class="sel" @change="run">
              <option>stretch</option><option>center</option><option>flex-start</option><option>flex-end</option>
            </select>
          </label>
          <label>子项数 <input v-model.number="items" type="number" class="num" min="1" max="24" /></label>
          <label><input v-model="wrap" type="checkbox" @change="run" /> 换行 wrap</label>
        </template>
        <template v-else>
          <label>列数 cols <input v-model.number="cols" type="number" class="num" min="1" max="12" @change="run" /></label>
          <label>行数 rows <input v-model.number="rows" type="number" class="num" min="1" max="12" @change="run" /></label>
          <label>水平对齐 justify-items
            <select v-model="justifyItems" class="sel" @change="run">
              <option>stretch</option><option>start</option><option>center</option><option>end</option>
            </select>
          </label>
          <label>垂直对齐 align-items
            <select v-model="alignItems" class="sel" @change="run">
              <option>stretch</option><option>start</option><option>center</option><option>end</option>
            </select>
          </label>
        </template>
      </div>
    </template>
    <template #input>
      <label class="lbl">预览</label>
      <div class="preview cells" :style="output">
        <div v-for="i in cellCount" :key="i" class="cell">{{ i }}</div>
      </div>
    </template>
    <template #output>
      <label class="lbl">CSS</label>
      <textarea :value="output" class="ta" rows="8" readonly />
    </template>
  </UiToolShell>
</template>
<style scoped>
.preview.cells {
  flex: 0 0 auto;
  min-height: 0;
  padding: 10px;
  align-content: start;
}
.cell {
  padding: 8px 12px;
  background: var(--brand-strong);
  border-radius: var(--radius-xs);
  color: #e0f2fe;
  font-size: 0.8rem;
  text-align: center;
  min-width: 36px;
}
</style>
