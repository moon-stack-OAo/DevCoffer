<script setup lang="ts">
const code = ref('console.log(1+2)\n2*3')
const logs = ref('')
const { output, error, setOutput, setError, clearError } = useToolState()
function run() {
  clearError(); logs.value = ''
  const lines: string[] = []
  const fake = {
    log: (...a: unknown[]) => lines.push(a.map(String).join(' ')),
    error: (...a: unknown[]) => lines.push('ERR ' + a.map(String).join(' ')),
    warn: (...a: unknown[]) => lines.push('WARN ' + a.map(String).join(' ')),
  }
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('console', '"use strict";\n' + code.value)
    const ret = fn(fake)
    logs.value = lines.join('\n')
    setOutput(ret === undefined ? '(undefined)' : String(ret))
  } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="JS 沙箱运行" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">运行</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">Function 沙箱 · 无 DOM/网络；勿粘贴不可信代码</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="code" class="ta" rows="12" />
    </template>
    <template #output>
      <label class="lbl">返回值</label>
      <textarea :value="output" class="ta" rows="4" readonly />
      <label class="lbl">console</label>
      <div class="log">{{ logs || '(空)' }}</div>
    </template>
  </UiToolShell>
</template>
