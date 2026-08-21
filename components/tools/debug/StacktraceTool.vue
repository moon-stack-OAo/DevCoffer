<script setup lang="ts">
import { formatStackTrace } from '#shared/debug/stacktrace'

const hideJdk = ref(true)
const collapse = ref(false)
const { input, output, error, setOutput, setError, clearError } = useToolState(
  `java.lang.IllegalStateException: boom
\tat com.example.App.run(App.java:42)
\tat com.example.App.main(App.java:10)
\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
Caused by: java.io.IOException: disk
\tat com.example.IO.read(IO.java:5)
\t... 2 more`,
)

function doFormat() {
  clearError()
  try { setOutput(formatStackTrace(input.value, { hideJdk: hideJdk.value, collapse: collapse.value })) } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>

<template>
  <UiToolShell title="堆栈解析" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doFormat">解析</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label><input v-model="hideJdk" type="checkbox" /> 隐藏 JDK/框架帧</label>
        <label><input v-model="collapse" type="checkbox" /> 折叠框架帧</label>
      </div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="14" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>

