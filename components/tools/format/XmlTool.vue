<script setup lang="ts">
import { compressXml, formatXml, validateXml, XML_SAMPLE } from '#shared/format/xml'

const { input, output, error, setOutput, setError, clearError } = useToolState(XML_SAMPLE)

function doFormat() {
  clearError()
  try {
    setOutput(formatXml(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function doCompress() {
  clearError()
  try {
    setOutput(compressXml(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function doValidate() {
  clearError()
  const r = validateXml(input.value)
  if (r.ok) setOutput(r.message)
  else setError(r.message)
}

function loadSample() {
  input.value = XML_SAMPLE
  clearError()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="XML 格式化" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doFormat">格式化</button>
      <button type="button" class="btn btn-ghost" @click="doCompress">压缩</button>
      <button type="button" class="btn btn-ghost" @click="doValidate">验证</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">格式化前会校验；浏览器使用 DOMParser，服务端回退栈校验。</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" placeholder="<root>…</root>" spellcheck="false" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>
