<script setup lang="ts">
import {
  CHARSET_ENCODINGS,
  bytesToBase64,
  bytesToHex,
  decodeBytes,
  isEncodingSupported,
  multiDecode,
  parseBase64,
  parseHex,
  textToUtf8Bytes,
} from '#shared/encode/charset'

const { input, output, error, setOutput, setError, clearError, reset } = useToolState()
const inputFmt = ref<'text' | 'hex' | 'base64'>('hex')
const encoding = ref('gbk')
const outFmt = ref<'hex' | 'base64'>('hex')

function swap() {
  input.value = output.value
  output.value = ''
  clearError()
}

function getBytes() {
  const raw = input.value
  if (!raw || !String(raw).trim()) throw new Error('请先输入内容')
  if (inputFmt.value === 'hex') return parseHex(raw)
  if (inputFmt.value === 'base64') return parseBase64(raw)
  return textToUtf8Bytes(raw)
}

/** 字节 → 文本（指定编码解码） */
function decodeOne() {
  clearError()
  try {
    if (!isEncodingSupported(encoding.value)) {
      throw new Error('当前浏览器不支持编码：' + encoding.value)
    }
    const bytes = getBytes()
    setOutput(decodeBytes(bytes, encoding.value, false))
  } catch (e) {
    setError(e instanceof Error ? e.message : '解码失败')
  }
}

/** 文本 → UTF-8 字节（Hex / Base64） */
function toUtf8Bytes() {
  clearError()
  try {
    let text: string
    if (inputFmt.value === 'text') {
      text = input.value
      if (!text) throw new Error('请先输入文本')
    } else {
      // 先按当前源编码把字节解成文本，再编码为 UTF-8
      if (!isEncodingSupported(encoding.value)) {
        throw new Error('当前浏览器不支持编码：' + encoding.value)
      }
      const bytes = getBytes()
      text = decodeBytes(bytes, encoding.value, false)
    }
    const utf8 = textToUtf8Bytes(text)
    setOutput(outFmt.value === 'base64' ? bytesToBase64(utf8) : bytesToHex(utf8))
  } catch (e) {
    setError(e instanceof Error ? e.message : '编码失败')
  }
}

/** 多编码对照 */
function decodeMulti() {
  clearError()
  try {
    setOutput(multiDecode(getBytes()))
  } catch (e) {
    setError(e instanceof Error ? e.message : '对照失败')
  }
}
</script>

<template>
  <UiToolShell title="编码解码" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="decodeOne">字节 → 文本</button>
      <button type="button" class="btn btn-ghost" @click="toUtf8Bytes">文本 → UTF-8 字节</button>
      <button type="button" class="btn btn-ghost" @click="decodeMulti">多编码对照</button>
      <button type="button" class="btn btn-ghost" @click="swap">结果→输入</button>
      <button type="button" class="btn btn-ghost" @click="reset">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">
        能力说明：① Hex/Base64 字节按指定编码<strong>解码为文本</strong>（GBK 等依赖浏览器 TextDecoder）；
        ② 文本<strong>仅可编码为 UTF-8</strong>字节（Hex/Base64）；③ 多编码对照用于乱码还原。
        <strong>不是</strong>任意字符集互转。
      </p>
      <div class="opts">
        <label>输入格式
          <select v-model="inputFmt" class="sel">
            <option value="text">文本</option>
            <option value="hex">Hex 字节</option>
            <option value="base64">Base64 字节</option>
          </select>
        </label>
        <label>解码编码
          <select v-model="encoding" class="sel">
            <option v-for="e in CHARSET_ENCODINGS" :key="e.value" :value="e.value">{{ e.label }}</option>
          </select>
        </label>
        <label>UTF-8 输出
          <select v-model="outFmt" class="sel">
            <option value="hex">Hex</option>
            <option value="base64">Base64</option>
          </select>
        </label>
      </div>
    </template>
    <template #input>
      <label class="lbl">输入（文本 / Hex / Base64）</label>
      <textarea
        v-model="input"
        class="ta"
        rows="12"
        placeholder="示例 Hex：c4e3bac3（GBK「你好」）&#10;或粘贴 Base64 字节；输入格式选「文本」时按 UTF-8 处理"
      />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
  </UiToolShell>
</template>
