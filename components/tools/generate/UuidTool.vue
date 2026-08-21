<script setup lang="ts">
import { generateUuids } from '#shared/generate/uuid'

const count = ref(1)
const uppercase = ref(false)
const noHyphen = ref(false)
const { output, error, setOutput, setError, clearError } = useToolState()

function doGenerate() {
    clearError()
    try {
        const list = generateUuids(Number(count.value), {
            uppercase: uppercase.value,
            noHyphen: noHyphen.value,
        })
        setOutput(list.join('\n'))
    } catch (e) {
        setError(e instanceof Error ? e.message : '生成失败')
    }
}

onMounted(() => {
    doGenerate()
})
</script>

<template>
  <UiToolShell title="UUID 生成" :error="error" :dual="false">
    <template #actions>
      <label class="opt">
        数量
        <input v-model.number="count" type="number" min="1" max="500" class="num" />
      </label>
      <label><input v-model="uppercase" type="checkbox" /> 大写</label>
      <label><input v-model="noHyphen" type="checkbox" /> 去连字符</label>
      <button type="button" class="btn" @click="doGenerate">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <label class="lbl">结果（每行一个）</label>
    <textarea :value="output" class="ta" rows="14" readonly placeholder="点击生成…" />
  </UiToolShell>
</template>
