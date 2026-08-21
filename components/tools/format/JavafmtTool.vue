<script setup lang="ts">
import {
  formatJava,
  JAVA_FMT_SAMPLE,
  type JavaBraceStyle,
} from '#shared/format/javafmt'

const { input, output, error, setOutput, setError, clearError } = useToolState(JAVA_FMT_SAMPLE)

const indent = ref('    ')
const brace = ref<JavaBraceStyle>('kr')
const sortImports = ref(true)
const chainBreak = ref(false)
const annotationBreak = ref(true)

function opts() {
  return {
    indent: indent.value,
    brace: brace.value,
    sortImports: sortImports.value,
    chainBreak: chainBreak.value,
    annotationBreak: annotationBreak.value,
  }
}

function doFormat() {
  clearError()
  try {
    if (!input.value.trim()) {
      setError('请输入 Java 代码')
      setOutput('')
      return
    }
    setOutput(formatJava(input.value, { ...opts(), compress: false }))
  } catch (e) {
    setError(e instanceof Error ? e.message : '格式化失败')
  }
}

function doCompress() {
  clearError()
  try {
    if (!input.value.trim()) {
      setError('请输入 Java 代码')
      setOutput('')
      return
    }
    setOutput(formatJava(input.value, { compress: true }))
  } catch (e) {
    setError(e instanceof Error ? e.message : '压缩失败')
  }
}

function loadSample() {
  input.value = JAVA_FMT_SAMPLE
  clearError()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="Java 代码格式化" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doFormat">格式化</button>
      <button type="button" class="btn btn-ghost" @click="doCompress">压缩</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label class="opts-inline">
          缩进
          <select v-model="indent" class="sel">
            <option :value="'\t'">Tab</option>
            <option value="  ">2 空格</option>
            <option value="    ">4 空格</option>
          </select>
        </label>
        <label class="opts-inline">
          大括号
          <select v-model="brace" class="sel">
            <option value="kr">K&amp;R（同行）</option>
            <option value="allman">Allman（下一行）</option>
          </select>
        </label>
        <label class="opts-inline">
          <input v-model="sortImports" type="checkbox" /> import 排序分组
        </label>
        <label class="opts-inline">
          <input v-model="chainBreak" type="checkbox" /> 方法链每行一个
        </label>
        <label class="opts-inline">
          <input v-model="annotationBreak" type="checkbox" /> 多注解换行
        </label>
      </div>
      <p class="hint">简化版美化器（自实现 tokenizer），覆盖日常场景；不保证与 google-java-format 等价。</p>
    </template>
    <template #input>
      <label class="lbl">Java 输入</label>
      <textarea
        v-model="input"
        class="ta"
        rows="12"
        placeholder="粘贴 Java 代码…"
        spellcheck="false"
      />
    </template>
    <template #output>
      <label class="lbl">格式化结果</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>

<style scoped>
.opts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
}
.opts-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--text-muted);
}
.opts-inline .sel {
  width: auto;
  min-width: 90px;
}
.opts-inline input[type='checkbox'] {
  width: 15px;
  height: 15px;
  accent-color: var(--brand);
  cursor: pointer;
}
</style>
