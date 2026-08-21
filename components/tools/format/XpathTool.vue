<script setup lang="ts">
import {
  runXPath,
  XPATH_SAMPLE_XML,
  XPATH_SAMPLE_EXPR,
  toFriendlyXPathError,
} from '#shared/format/xpath'

const xml = ref(XPATH_SAMPLE_XML)
const expr = ref(XPATH_SAMPLE_EXPR)
const { output, error, setOutput, setError, clearError } = useToolState()

function run() {
  clearError()
  try {
    setOutput(runXPath(xml.value, expr.value).text)
  } catch (e) {
    setError(toFriendlyXPathError(e))
  }
}

function loadSample() {
  xml.value = XPATH_SAMPLE_XML
  expr.value = XPATH_SAMPLE_EXPR
  clearError()
}

function clearAll() {
  xml.value = ''
  expr.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="XPath 查询" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">查询</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">浏览器 DOMParser + document.evaluate；错误已转为中文提示。</p>
    </template>
    <template #input>
      <label class="lbl">XML</label>
      <textarea v-model="xml" class="ta" rows="8" spellcheck="false" />
      <label class="lbl">XPath</label>
      <input v-model="expr" class="inp" style="width:100%" />
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="10" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>
