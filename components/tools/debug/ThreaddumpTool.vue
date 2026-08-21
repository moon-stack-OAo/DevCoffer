<script setup lang="ts">
import { formatThreadDump } from '#shared/debug/threaddump'

const { input, output, error, setOutput, setError, clearError } = useToolState(
  `"main" #1 prio=5 tid=0x01 nid=0x1234 runnable
   java.lang.Thread.State: RUNNABLE
\tat com.example.App.main(App.java:10)

"Idle" #2 daemon prio=5 tid=0x02 nid=0x1235 waiting on condition
   java.lang.Thread.State: TIMED_WAITING`,
)

function doParse() {
  clearError()
  try { setOutput(formatThreadDump(input.value)) } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>

<template>
  <UiToolShell title="线程 Dump 统计" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doParse">解析</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">粘贴 jstack / Thread dump 文本，输出状态分布与线程列表。</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="14" />
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>

