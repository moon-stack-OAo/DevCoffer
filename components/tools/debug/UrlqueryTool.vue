<script setup lang="ts">
import { urlQueryBuild, urlQueryParse, urlQueryParamsToText } from '#shared/debug/urlquery'

const urlIn = ref('https://example.com/search?q=hello&page=1#top')
const base = ref('https://example.com/search')
const params = ref('q=hello\npage=1')
const hash = ref('top')
const { output, error, setOutput, setError, clearError } = useToolState()

function doParse() {
  clearError()
  const r = urlQueryParse(urlIn.value)
  if (!r.ok) { setError(r.msg || '失败'); return }
  base.value = r.base || ''
  params.value = urlQueryParamsToText(r.params || [])
  hash.value = r.hash || ''
  setOutput(['Base: ' + base.value, 'Hash: ' + hash.value, '', params.value].join('\n'))
}
function doBuild() {
  clearError()
  const r = urlQueryBuild(base.value, params.value, hash.value)
  if (!r.ok) { setError(r.msg || '失败'); return }
  setOutput(r.url || '')
}
</script>

<template>
  <UiToolShell title="URL Query" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doParse">从 URL 解析</button>
      <button type="button" class="btn" @click="doBuild">构造 URL</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      <label class="lbl">完整 URL（解析用）</label>
      <textarea v-model="urlIn" class="ta" rows="3" />
      <label class="lbl">Base</label>
      <input v-model="base" class="inp" style="width:100%;margin-bottom:8px" />
      <label class="lbl">参数（每行 key=value）</label>
      <textarea v-model="params" class="ta" rows="6" />
      <label class="lbl">Hash</label>
      <input v-model="hash" class="inp" style="width:100%" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly />
    </template>
  </UiToolShell>
</template>

