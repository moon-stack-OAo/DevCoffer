<script setup lang="ts">
const { input, output, error, setOutput, clearError } = useToolState('print("hello")')
function run() {
  clearError()
  setOutput([
    '本工具未内嵌 Pyodide（体积大）。',
    '可选方案：',
    '1. 本地安装 Python 后运行脚本',
    '2. 后续版本动态加载 pyodide',
    '',
    '你的代码草稿：',
    input.value,
  ].join('\n'))
}
run()
</script>
<template>
  <UiToolShell title="Python 运行（说明）" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">说明</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">Pyodide 未默认集成，保留草稿区</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="10" />
    </template>
    <template #output>
      <label class="lbl">说明</label>
      <textarea :value="output" class="ta" rows="12" readonly />
    </template>
  </UiToolShell>
</template>
