<script setup lang="ts">
import { decodeBase64, encodeBase64 } from '#shared/encode/base64'
import {
  base32Decode,
  base32Encode,
  base58Decode,
  base58Encode,
  bytesToText,
  textToBytes,
} from '#shared/encode/base32'

type Algo = 'base64' | 'base32' | 'base58'

const route = useRoute()
const { input, output, error, setOutput, setError, clearError, reset } = useToolState()

function parseAlgo(raw: unknown): Algo {
  const v = String(raw || '').toLowerCase()
  if (v === 'base64' || v === 'base32' || v === 'base58') return v
  return 'base64'
}

const algo = ref<Algo>(parseAlgo(route.query.algo))
const padding = ref(true)

function doEncode() {
  clearError()
  try {
    if (algo.value === 'base64') {
      setOutput(encodeBase64(input.value))
      return
    }
    if (algo.value === 'base58') {
      setOutput(base58Encode(textToBytes(input.value)))
      return
    }
    setOutput(base32Encode(textToBytes(input.value), { padding: padding.value }))
  } catch (e) {
    setError(e instanceof Error ? e.message : '编码失败')
  }
}

function doDecode() {
  clearError()
  try {
    if (algo.value === 'base64') {
      setOutput(decodeBase64(input.value))
      return
    }
    if (algo.value === 'base58') {
      setOutput(bytesToText(base58Decode(input.value)))
      return
    }
    setOutput(bytesToText(base32Decode(input.value)))
  } catch (e) {
    setError(e instanceof Error ? e.message : '解码失败')
  }
}

function swap() {
  input.value = output.value
  output.value = ''
  clearError()
}

const placeholder = computed(() => {
  if (algo.value === 'base64') return '文本或 Base64（支持 URL-safe 解码）…'
  if (algo.value === 'base58') return '文本或 Base58…'
  return '文本或 Base32…'
})
</script>

<template>
  <UiToolShell title="BaseN 编解码" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doEncode">编码</button>
      <button type="button" class="btn" @click="doDecode">解码</button>
      <button type="button" class="btn btn-ghost" @click="swap">结果→输入</button>
      <button type="button" class="btn btn-ghost" @click="reset">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">
        Base64（解码支持 URL-safe）、Base32（RFC 4648）、Base58（Bitcoin 字母表）；均按 UTF-8 文本编解码。
      </p>
      <div class="opts">
        <label>算法
          <select v-model="algo" class="sel">
            <option value="base64">Base64</option>
            <option value="base32">Base32</option>
            <option value="base58">Base58</option>
          </select>
        </label>
        <label v-if="algo === 'base32'"><input v-model="padding" type="checkbox" /> Padding</label>
      </div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" :placeholder="placeholder" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>
