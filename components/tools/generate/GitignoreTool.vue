<script setup lang="ts">
import { gitignoreGroups, gitignoreMerge } from '#shared/generate/gitignore'

const selected = ref<string[]>(['node', 'ide', 'env'])
const custom = ref('')
const groups = gitignoreGroups()
const { output, error, setOutput, clearError } = useToolState()

const selectedCount = computed(() => selected.value.length)
const ruleLineCount = computed(() =>
    output.value
        ? output.value.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#')).length
        : 0,
)

function run() {
    clearError()
    setOutput(gitignoreMerge(selected.value, custom.value))
}

function toggle(id: string) {
    if (selected.value.includes(id)) selected.value = selected.value.filter((x) => x !== id)
    else selected.value = [...selected.value, id]
    run()
}

function selectGroup(ids: string[]) {
    const allOn = ids.every((id) => selected.value.includes(id))
    if (allOn) selected.value = selected.value.filter((id) => !ids.includes(id))
    else selected.value = [...new Set([...selected.value, ...ids])]
    run()
}

function clearSelected() {
    selected.value = []
    run()
}

function downloadGitignore() {
    if (!import.meta.client || !output.value) return
    const blob = new Blob([output.value], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = '.gitignore'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

watch(custom, () => run())
onMounted(() => run())
</script>

<template>
  <UiToolShell title=".gitignore 生成" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <button type="button" class="btn btn-ghost" :disabled="!output" @click="downloadGitignore">下载</button>
      <UiCopyButton :text="output" />
    </template>

    <template #input>
      <div class="left">
        <div class="meta">
          <span class="meta-item">已选 <b>{{ selectedCount }}</b> 个模板</span>
          <button type="button" class="link" :disabled="!selectedCount" @click="clearSelected">清空选择</button>
        </div>

        <div class="groups">
          <div v-for="g in groups" :key="g.group" class="group">
            <div class="ghead">
              <span class="gtitle">{{ g.group }}</span>
              <button
                type="button"
                class="btn btn-ghost sm"
                @click="selectGroup(g.items.map((i) => i.id))"
              >
                {{ g.items.every((i) => selected.includes(i.id)) ? '取消本组' : '全选本组' }}
              </button>
            </div>
            <div class="chips">
              <button
                v-for="t in g.items"
                :key="t.id"
                type="button"
                class="chip"
                :class="{ active: selected.includes(t.id) }"
                @click="toggle(t.id)"
              >
                {{ t.name }}
              </button>
            </div>
          </div>
        </div>

        <label class="lbl">自定义规则（每行一条）</label>
        <textarea
          v-model="custom"
          class="custom"
          rows="4"
          placeholder="例如：&#10;*.local&#10;tmp/&#10;!keep.txt"
        />
      </div>
    </template>

    <template #output>
      <div class="meta">
        <span class="meta-item">结果 · <b>{{ ruleLineCount }}</b> 条规则</span>
      </div>
      <pre class="out">{{ output }}</pre>
    </template>
  </UiToolShell>
</template>

<style scoped>
.left {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-right: 2px;
}
.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  flex: 0 0 auto;
}
.meta-item {
  font-size: 0.8rem;
  color: var(--text-muted);
}
.meta-item b {
  color: var(--brand);
  font-weight: 600;
}
.link {
  border: 0;
  background: transparent;
  color: var(--brand);
  font-size: 0.78rem;
  cursor: pointer;
  padding: 0;
}
.link:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.groups {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
  flex: 0 0 auto;
}
.group {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  background: var(--bg-input);
}
.ghead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  gap: 8px;
}
.gtitle {
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 600;
}
.chips {
  margin-bottom: 0;
}
.btn.sm {
  padding: 2px 8px;
  font-size: 0.75rem;
}
.lbl {
  flex: 0 0 auto;
}
.custom {
  flex: 0 0 auto;
  width: 100%;
  min-height: 5rem;
  max-height: 7rem;
  resize: vertical;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.82rem;
  line-height: 1.45;
  box-sizing: border-box;
}
.custom:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--brand) 55%, var(--border));
}
.out {
  margin: 0;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.84rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
</style>
