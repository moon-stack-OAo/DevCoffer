<script setup lang="ts">
import { decodeProtobufWire, parseProtobufBytes, protobufHelp } from '#shared/encode/protobuf'

const SCHEMA_SAMPLE = '{"1":"hello","2":123}'
/** 示例：field1 string "hi" → 0a026869 */
const WIRE_HEX_SAMPLE = '0a026869'

const { input, output, error, setOutput, setError, clearError } = useToolState(WIRE_HEX_SAMPLE)

/** schema：JSON 示意；wire：Hex/Base64 解码 */
const mode = ref<'schema' | 'wire'>('wire')
const wireFormat = ref<'hex' | 'base64'>('hex')

const inputPlaceholder = computed(() => {
  if (mode.value !== 'wire') return SCHEMA_SAMPLE
  return wireFormat.value === 'hex'
    ? '粘贴 Protobuf wire 的 Hex…'
    : '粘贴 Protobuf wire 的 Base64…'
})

function run() {
  clearError()
  try {
    if (mode.value === 'schema') {
      setOutput(protobufHelp(input.value))
    } else {
      const bytes = parseProtobufBytes(input.value, wireFormat.value)
      setOutput(decodeProtobufWire(bytes))
    }
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function clearAll() {
  input.value = ''
  output.value = ''
  clearError()
}

function onModeChange(next: 'schema' | 'wire') {
  mode.value = next
  output.value = ''
  clearError()
  if (next === 'schema') {
    if (!input.value.trim() || input.value === WIRE_HEX_SAMPLE) input.value = SCHEMA_SAMPLE
  } else if (!input.value.trim() || input.value === SCHEMA_SAMPLE) {
    input.value = WIRE_HEX_SAMPLE
  }
}
</script>

<template>
  <UiToolShell title="Protobuf 编解码辅助" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="run">
        {{ mode === 'wire' ? '解码' : '分析' }}
      </button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="pb-toolbar">
        <p class="hint">
          无 schema 的通用 wire 解码 + JSON 字段示意；非完整 .proto 编译。复杂 schema 请用官方工具链。
        </p>
        <div class="tabs">
          <button
            type="button"
            class="tab"
            :class="{ active: mode === 'wire' }"
            @click="onModeChange('wire')"
          >
            解码（Hex/Base64→字段）
          </button>
          <button
            type="button"
            class="tab"
            :class="{ active: mode === 'schema' }"
            @click="onModeChange('schema')"
          >
            示意（JSON→wire）
          </button>
        </div>
      </div>
    </template>

    <div class="pb-main">
      <div class="pb-col">
        <div class="pb-card pb-card-input">
          <div class="pb-card-title">
            <i class="bi bi-input-cursor-text" />
            {{ mode === 'wire' ? 'Wire 输入' : 'JSON 字段示意' }}
          </div>
          <div v-if="mode === 'wire'" class="row" style="margin-bottom: 8px; gap: 8px">
            <label class="lbl" style="margin: 0">输入格式</label>
            <select v-model="wireFormat" class="sel">
              <option value="hex">Hex</option>
              <option value="base64">Base64</option>
            </select>
          </div>
          <textarea
            v-model="input"
            class="ta pb-input"
            :placeholder="inputPlaceholder"
          />
          <div class="pb-hint">
            <template v-if="mode === 'wire'">
              支持清洗空白后的 Hex / Base64。输出含 field number、wire type、varint/fixed/length-delimited 及 UTF-8 尝试。
            </template>
            <template v-else>
              键为 field number，值为 number（varint）或 string（length-delimited）时给出 tag / 字节示意。
            </template>
          </div>
        </div>
      </div>
      <div class="pb-col">
        <div class="pb-output-wrap">
          <div class="pb-card-title"><i class="bi bi-terminal" /> 输出</div>
          <pre class="output-box pb-output" :class="{ error: !!error && !output }">{{ output }}</pre>
        </div>
      </div>
    </div>
  </UiToolShell>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-top: 8px;
}
.tab {
  padding: 8px 14px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 13px;
  margin-bottom: -1px;
}
.tab.active {
  color: var(--accent, #818cf8);
  border-bottom-color: var(--accent, #818cf8);
  font-weight: 600;
}
.row {
  display: flex;
  align-items: center;
}
</style>
