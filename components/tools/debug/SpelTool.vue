<script setup lang="ts">
import { formatSpelEval, spelAnalyze } from '#shared/debug/spel'

const mode = ref<'eval' | 'analyze'>('eval')
const ctx = ref(JSON.stringify({ user: { age: 20, name: 'a' } }, null, 2))
const { input, output, error, setOutput, setError, clearError } = useToolState(
  "#user.age > 18 and #user.name != null",
)

function run() {
  clearError()
  try {
    if (mode.value === 'analyze') {
      setOutput(spelAnalyze(input.value))
      return
    }
    setOutput(formatSpelEval(input.value, ctx.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}
</script>

<template>
  <UiToolShell title="SpEL 试算 / 分析" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">执行</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label><input v-model="mode" type="radio" value="eval" /> 简易试算</label>
        <label><input v-model="mode" type="radio" value="analyze" /> 结构分析</label>
      </div>
      <p class="hint">试算为子集：算术/比较/逻辑/三元/属性路径；不支持方法调用、T()、@bean。</p>
    </template>
    <template #input>
      <label class="lbl">表达式</label>
      <textarea v-model="input" class="ta" rows="6" />
      <template v-if="mode === 'eval'">
        <label class="lbl">Context (JSON 对象)</label>
        <textarea v-model="ctx" class="ta" rows="8" />
      </template>
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="12" readonly />
    </template>
  </UiToolShell>
</template>
