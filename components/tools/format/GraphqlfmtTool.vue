<script setup lang="ts">
import {
  formatGraphql,
  minifyGraphql,
  checkGraphqlBalance,
  GRAPHQL_SAMPLE,
} from '#shared/format/graphqlfmt'

const { input, output, error, setOutput, setError, clearError } = useToolState(GRAPHQL_SAMPLE)

function doFormat() {
  clearError()
  try {
    setOutput(formatGraphql(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function doMin() {
  clearError()
  try {
    setOutput(minifyGraphql(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function doCheck() {
  clearError()
  const issues = checkGraphqlBalance(input.value)
  if (issues.length) {
    setError(issues.join('\n'))
    output.value = ''
  } else {
    setOutput('括号平衡 OK')
  }
}

function loadSample() {
  input.value = GRAPHQL_SAMPLE
  clearError()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="GraphQL 格式化" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doFormat">格式化</button>
      <button type="button" class="btn" @click="doMin">压缩</button>
      <button type="button" class="btn btn-ghost" @click="doCheck">括号检查</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">轻量缩进，不做完整 GraphQL 语法校验；括号问题走错误区。</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea
        v-model="input"
        class="ta"
        rows="12"
        placeholder="query { user { name } }"
        spellcheck="false"
      />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>
