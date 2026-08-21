<script setup lang="ts">
import { TPL_PATTERNS, applyTemplate, parseVarsText } from '#shared/text/tplreplace'

const { input, output, error, setOutput, setError, clearError } = useToolState(
  'Hello {{name}}, order {{orderId}} is {{status}}.',
)
const syntax = ref('mustache')
const varsText = ref('name=Alice\norderId=20240115\nstatus=已发货')

function run() {
  clearError()
  try {
    if (!input.value) throw new Error('请输入模板')
    const vars = parseVarsText(varsText.value)
    const r = applyTemplate(input.value, vars, syntax.value)
    let text = r.text
    if (r.missing.length) {
      text += '\n\n⚠ 缺失变量: ' + r.missing.join(', ')
      setError('缺失变量: ' + r.missing.join(', '))
      output.value = text
      return
    }
    setOutput(text)
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}
</script>

<template>
  <UiToolShell title="模板替换" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">替换</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>语法
          <select v-model="syntax" class="sel">
            <option v-for="(p, id) in TPL_PATTERNS" :key="id" :value="id">{{ p.label }}</option>
          </select>
        </label>
      </div>
    </template>
    <template #input>
      <label class="lbl">模板</label>
      <textarea v-model="input" class="ta" rows="8" placeholder="模板…" />
      <label class="lbl" style="margin-top:10px">变量（key=value 每行一个）</label>
      <textarea v-model="varsText" class="ta" rows="5" placeholder="name=Alice" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="14" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>

