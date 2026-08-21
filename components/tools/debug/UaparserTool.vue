<script setup lang="ts">
import { UAParser } from 'ua-parser-js'
import { UA_PRESETS, formatUaParse } from '#shared/debug/uaparser'

const preset = ref('')
const { input, output, error, setOutput, setError, clearError } = useToolState('')

onMounted(() => {
  if (!input.value && typeof navigator !== 'undefined') input.value = navigator.userAgent
})

function run() {
  clearError()
  const ua = (input.value || '').trim()
  if (!ua) {
    setError('请输入 User-Agent 字符串')
    return
  }
  try {
    const r = UAParser(ua)
    setOutput(
      formatUaParse(
        {
          ua: r.ua,
          browser: {
            name: r.browser?.name,
            version: r.browser?.version,
            major: r.browser?.major,
            type: r.browser?.type,
          },
          engine: { name: r.engine?.name, version: r.engine?.version },
          os: { name: r.os?.name, version: r.os?.version },
          device: { type: r.device?.type, vendor: r.device?.vendor, model: r.device?.model },
          cpu: { architecture: r.cpu?.architecture },
        },
        ua,
      ),
    )
  } catch (e) {
    setError(e instanceof Error ? e.message : '解析失败')
  }
}

function useCurrent() {
  if (typeof navigator !== 'undefined') input.value = navigator.userAgent
  run()
}

function applyPreset() {
  const key = preset.value
  if (!key) return
  const item = UA_PRESETS[key]
  if (!item) return
  input.value = item.ua
  run()
}
</script>
<template>
  <UiToolShell title="UA Parser" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">解析</button>
      <button type="button" class="btn btn-ghost" @click="useCurrent">使用当前浏览器</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>
          常用 UA
          <select v-model="preset" class="sel" @change="applyPreset">
            <option value="">— 选择一个 —</option>
            <option v-for="(p, key) in UA_PRESETS" :key="key" :value="key">{{ p.label }}</option>
          </select>
        </label>
      </div>
      <p class="hint">使用 ua-parser-js · DevCoffer 本地解析，不上传 UA</p>
    </template>
    <template #input>
      <label class="lbl">User-Agent</label>
      <textarea v-model="input" class="ta" rows="6" placeholder="Mozilla/5.0 …" />
    </template>
    <template #output>
      <label class="lbl">解析结果</label>
      <textarea :value="output || '点击「解析」查看结果'" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>
