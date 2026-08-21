<script setup lang="ts">
import {
    bumpSemver,
    formatRangeCheck,
    formatSemverCompare,
    parseSemver,
    sortSemvers,
    type SemverBumpType,
} from '#shared/generate/semver'

const verA = ref('1.2.3')
const verB = ref('1.3.0-beta.1')
const range = ref('^1.2.0')
const list = ref('1.0.0\n2.0.0-rc.1\n1.2.3\nv1.10.0')
const { output, error, setOutput, setError, clearError } = useToolState()

function doParse() {
    clearError()
    const p = parseSemver(verA.value)
    if (!p) {
        setError('版本无效')
        return
    }
    setOutput(JSON.stringify(p, null, 2))
}

function doCompare() {
    clearError()
    try {
        setOutput(formatSemverCompare(verA.value, verB.value))
    } catch (e) {
        setError(e instanceof Error ? e.message : '比较失败')
    }
}

function doSort(desc = false) {
    clearError()
    const sorted = sortSemvers(list.value, { desc })
    setOutput(sorted.join('\n'))
}

function doBump(type: SemverBumpType) {
    clearError()
    try {
        const next = bumpSemver(verA.value, type)
        setOutput(`${verA.value} → ${next} (${type})`)
        verA.value = next
    } catch (e) {
        setError(e instanceof Error ? e.message : 'bump 失败')
    }
}

function doRange() {
    clearError()
    try {
        setOutput(formatRangeCheck(verA.value, range.value))
    } catch (e) {
        setError(e instanceof Error ? e.message : 'range 校验失败')
    }
}
</script>

<template>
  <UiToolShell title="SemVer" :error="error" :dual="false">
    <template #actions>
      <UiCopyButton :text="output" />
    </template>

    <p class="hint">解析 / bump / 比较 A 与 B；range 支持 ^1.2.3、~1.2.3</p>

    <div class="sec">
      <h3>解析 / Bump</h3>
      <div class="row">
        <label class="field grow">
          <span class="lbl">版本 A</span>
          <input v-model="verA" class="inp" placeholder="1.2.3" />
        </label>
        <button type="button" class="btn" @click="doParse">解析</button>
        <button type="button" class="btn btn-ghost" @click="doBump('major')">major</button>
        <button type="button" class="btn btn-ghost" @click="doBump('minor')">minor</button>
        <button type="button" class="btn btn-ghost" @click="doBump('patch')">patch</button>
      </div>
    </div>

    <div class="sec">
      <h3>比较 / Range</h3>
      <div class="row">
        <label class="field grow">
          <span class="lbl">版本 A</span>
          <input v-model="verA" class="inp" placeholder="1.2.3" />
        </label>
        <label class="field grow">
          <span class="lbl">版本 B</span>
          <input v-model="verB" class="inp" placeholder="1.3.0" />
        </label>
        <button type="button" class="btn" @click="doCompare">比较 A/B</button>
      </div>
      <div class="row range-row">
        <label class="field grow">
          <span class="lbl">Range（相对版本 A）</span>
          <input v-model="range" class="inp" placeholder="^1.2.3 或 ~1.2.3" />
        </label>
        <button type="button" class="btn btn-ghost" @click="doRange">校验 range</button>
      </div>
    </div>

    <div class="sec">
      <h3>排序</h3>
      <label class="lbl">版本列表（每行一个）</label>
      <textarea v-model="list" class="ta" rows="5" placeholder="每行一个版本号…" />
      <div class="row sort-actions">
        <button type="button" class="btn" @click="doSort(false)">升序</button>
        <button type="button" class="btn btn-ghost" @click="doSort(true)">降序</button>
      </div>
    </div>

    <label class="lbl">结果</label>
    <pre class="out">{{ output || '点击上方按钮查看结果…' }}</pre>
  </UiToolShell>
</template>

<style scoped>
.hint {
  margin: 0 0 12px;
  font-size: 0.8rem;
  color: var(--text-muted);
}
.sec {
  margin-bottom: 20px;
}
.sec h3 {
  margin: 0 0 10px;
  font-size: 0.9rem;
  color: var(--text);
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 14px;
  align-items: flex-end;
}
.range-row {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
}
.sort-actions {
  margin-top: 10px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.field.grow {
  flex: 1 1 140px;
}
.field .lbl {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}
.row .inp {
  width: 100%;
  min-width: 0;
  padding: 6px 10px;
}
.out {
  margin: 0;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.9rem;
  white-space: pre-wrap;
  min-height: 8rem;
}
</style>
