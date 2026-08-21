<script setup lang="ts">
import {
  ddlSemanticDiff,
  ddlLineDiff,
  DDLDIFF_SAMPLE_A,
  DDLDIFF_SAMPLE_B,
} from '#shared/text/ddldiff'

const left = ref(DDLDIFF_SAMPLE_A)
const right = ref(DDLDIFF_SAMPLE_B)
const mode = ref<'semantic' | 'line'>('semantic')
const { output, error, setOutput, setError, clearError } = useToolState()

function run() {
  clearError()
  try {
    if (!String(left.value || '').trim() && !String(right.value || '').trim()) {
      setError('请输入 DDL A / B')
      return
    }
    if (mode.value === 'semantic') setOutput(ddlSemanticDiff(left.value, right.value))
    else setOutput(ddlLineDiff(left.value, right.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function loadSample() {
  left.value = DDLDIFF_SAMPLE_A
  right.value = DDLDIFF_SAMPLE_B
  clearError()
  run()
}

function clearAll() {
  left.value = ''
  right.value = ''
  output.value = ''
  error.value = ''
}

onMounted(() => run())
</script>

<template>
  <UiToolShell title="Schema 对比" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="run">对比</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">
        默认语义对比（按 CREATE TABLE 拆表/列，启发式非完整 SQL 引擎）；可切换纯文本行
        Diff。
      </p>
      <div class="opts">
        <label>
          模式
          <select v-model="mode" class="sel" @change="run">
            <option value="semantic">语义对比</option>
            <option value="line">纯文本行 Diff</option>
          </select>
        </label>
      </div>
    </template>
    <div class="grid2">
      <div>
        <label class="lbl">DDL A</label>
        <textarea
          v-model="left"
          class="ta"
          rows="12"
          placeholder="CREATE TABLE …"
          spellcheck="false"
        />
      </div>
      <div>
        <label class="lbl">DDL B</label>
        <textarea
          v-model="right"
          class="ta"
          rows="12"
          placeholder="CREATE TABLE …"
          spellcheck="false"
        />
      </div>
    </div>
    <label class="lbl" style="margin-top: 12px">对比结果</label>
    <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
  </UiToolShell>
</template>
