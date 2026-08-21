<script setup lang="ts">
import {
  addBom,
  convertLineEndings,
  lineendingReport,
  stripBom,
  stripInvisibleChars,
  visualizeInvisibleChars,
} from '#shared/text/lineending'

const SAMPLE = '第一行\r\n第二行\n第三行\r含零宽\u200B字符\uFEFF'

const { input, output, error, setOutput, setError, clearError } = useToolState()
const keepTab = ref(true)
const visual = ref('')
const eolTarget = ref('')

function detect() {
  clearError()
  setOutput(lineendingReport(input.value))
  visual.value = visualizeInvisibleChars(input.value, { showNewline: true })
}

function convert(target: string) {
  clearError()
  input.value = convertLineEndings(input.value, target)
  detect()
}

function onEolChange() {
  if (!eolTarget.value) return
  convert(eolTarget.value)
  eolTarget.value = ''
}

function doStripBom() {
  input.value = stripBom(input.value)
  detect()
}

function doAddBom() {
  input.value = addBom(input.value)
  detect()
}

function doStripInv() {
  input.value = stripInvisibleChars(input.value, { keepTab: keepTab.value })
  detect()
}

function loadSample() {
  input.value = SAMPLE
  clearError()
  detect()
}

function clearAll() {
  input.value = ''
  output.value = ''
  visual.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="行尾 / BOM / 不可见字符" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="detect">检测</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" label="复制报告" />
      <UiCopyButton :text="input" label="复制文本" />
    </template>
    <template #toolbar>
      <p class="hint">说明：粘贴到文本框时浏览器可能已将 CRLF 规范为 LF；精确检测请用「→CRLF」转换后再观察，或从文件粘贴前注意。</p>
      <div class="opts">
        <label>行尾转换
          <select v-model="eolTarget" class="sel" @change="onEolChange">
            <option value="">选择…</option>
            <option value="LF">→ LF</option>
            <option value="CRLF">→ CRLF</option>
            <option value="CR">→ CR</option>
          </select>
        </label>
        <button type="button" class="btn btn-ghost" @click="doStripBom">去 BOM</button>
        <button type="button" class="btn btn-ghost" @click="doAddBom">加 BOM</button>
        <button type="button" class="btn btn-ghost" @click="doStripInv">去不可见</button>
        <label><input v-model="keepTab" type="checkbox" /> 保留 TAB</label>
      </div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="10" placeholder="粘贴文本…" />
      <label class="lbl" style="margin-top:10px">可视化</label>
      <textarea :value="visual" class="ta" rows="4" readonly />
    </template>
    <template #output>
      <label class="lbl">报告</label>
      <textarea :value="output" class="ta" rows="16" readonly placeholder="检测报告…" />
    </template>
  </UiToolShell>
</template>
