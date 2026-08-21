<script setup lang="ts">
import { generateNanoidByKey, generateUlids, parseUlid } from '#shared/generate/ulid'

const type = ref<'ulid' | 'nanoid'>('ulid')
const count = ref(5)
const nanoLen = ref(21)
const alphaKey = ref<'default' | 'url-safe'>('default')
const parseInput = ref('')
const parseResult = ref('')
const { output, error, setOutput, setError, clearError } = useToolState()

function doGenerate() {
    clearError()
    try {
        if (type.value === 'ulid') {
            setOutput(generateUlids(count.value).join('\n'))
        } else {
            const n = Math.max(1, Math.min(100, count.value))
            const list: string[] = []
            for (let i = 0; i < n; i++) list.push(generateNanoidByKey(nanoLen.value, alphaKey.value))
            setOutput(list.join('\n'))
        }
    } catch (e) {
        setError(e instanceof Error ? e.message : '生成失败')
    }
}

function doParse() {
    clearError()
    try {
        const p = parseUlid(parseInput.value || output.value.split('\n')[0] || '')
        parseResult.value = [`ID: ${p.id}`, `timestamp(ms): ${p.timestamp}`, `ISO: ${p.iso}`, `本地: ${p.localTime}`].join(
            '\n',
        )
    } catch (e) {
        setError(e instanceof Error ? e.message : '解析失败')
    }
}

onMounted(() => doGenerate())
</script>

<template>
  <UiToolShell title="ULID / NanoID" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="doGenerate">生成</button>
      <button type="button" class="btn btn-ghost" @click="doParse">解析 ULID</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>类型
          <select v-model="type" class="sel">
            <option value="ulid">ULID</option>
            <option value="nanoid">NanoID</option>
          </select>
        </label>
        <label>数量 <input v-model.number="count" type="number" min="1" max="100" class="num" /></label>
        <template v-if="type === 'nanoid'">
          <label>长度 <input v-model.number="nanoLen" type="number" min="2" max="64" class="num" /></label>
          <label>字母表
            <select v-model="alphaKey" class="sel">
              <option value="default">默认字母表</option>
              <option value="url-safe">URL-safe</option>
            </select>
          </label>
        </template>
      </div>
      <div class="opts" style="margin-top:8px">
        <label>解析 ULID <input v-model="parseInput" class="inp" placeholder="可选，默认取结果首行" style="min-width:260px" /></label>
      </div>
    </template>
    <label class="lbl">生成结果</label>
    <textarea :value="output" class="ta" rows="8" readonly />
    <label class="lbl">解析结果</label>
    <textarea :value="parseResult" class="ta" rows="6" readonly />
  </UiToolShell>
</template>

<style scoped>
.num { width: 64px; }
</style>
