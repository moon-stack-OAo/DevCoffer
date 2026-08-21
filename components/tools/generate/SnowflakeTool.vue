<script setup lang="ts">
import { generateSnowflakes, parseSnowflake } from '#shared/generate/snowflake'

const workerId = ref(1)
const datacenterId = ref(1)
const count = ref(5)
const parseInput = ref('')
const parseResult = ref('')
const { output, error, setOutput, setError, clearError } = useToolState()

function doGenerate() {
    clearError()
    try {
        setOutput(generateSnowflakes(count.value, workerId.value, datacenterId.value).join('\n'))
    } catch (e) {
        setError(e instanceof Error ? e.message : '生成失败')
    }
}

function doParse() {
    clearError()
    try {
        const id = (parseInput.value || output.value.split('\n')[0] || '').trim()
        const p = parseSnowflake(id)
        parseResult.value = [
            `ID: ${id}`,
            `timestamp: ${p.timestamp}`,
            `ISO: ${p.datetime}`,
            `本地: ${p.localTime}`,
            `datacenterId: ${p.datacenterId}`,
            `workerId: ${p.workerId}`,
            `sequence: ${p.sequence}`,
        ].join('\n')
    } catch (e) {
        setError(e instanceof Error ? e.message : '解析失败')
    }
}

onMounted(() => doGenerate())
</script>

<template>
  <UiToolShell title="雪花 ID" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="doGenerate">生成</button>
      <button type="button" class="btn btn-ghost" @click="doParse">解析</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>DC <input v-model.number="datacenterId" type="number" min="0" max="31" class="num" /></label>
        <label>Worker <input v-model.number="workerId" type="number" min="0" max="31" class="num" /></label>
        <label>数量 <input v-model.number="count" type="number" min="1" max="100" class="num" /></label>
        <label>解析 ID <input v-model="parseInput" class="inp" placeholder="可选，默认取结果首行" style="min-width:220px" /></label>
      </div>
      <p class="hint">Twitter Snowflake；Epoch 2010-11-04。</p>
    </template>
    <label class="lbl">生成结果</label>
    <textarea :value="output" class="ta" rows="8" readonly />
    <label class="lbl">解析结果</label>
    <textarea :value="parseResult" class="ta" rows="8" readonly />
  </UiToolShell>
</template>

<style scoped>
.num { width: 56px; }
</style>
