<script setup lang="ts">
import JsBarcode from 'jsbarcode'

const FORMAT_HINTS: Record<string, string> = {
  CODE128: 'CODE128：可含字母、数字与常见符号，长度较灵活。',
  EAN13: 'EAN13：需 12～13 位数字（12 位时自动算校验位）。',
  EAN8: 'EAN8：需 7～8 位数字（7 位时自动算校验位）。',
  UPC: 'UPC：需 11～12 位数字（11 位时自动算校验位）。',
  CODE39: 'CODE39：大写字母、数字与 - . $ / + % 空格；可用 * 作起止符。',
}

const text = ref('123456789012')
const format = ref('CODE128')
const svgRef = ref<SVGSVGElement | null>(null)
const { output, error, setOutput, setError, clearError } = useToolState()

const formatHint = computed(() => FORMAT_HINTS[format.value] || '')

function run() {
  clearError()
  try {
    if (!svgRef.value) return
    JsBarcode(svgRef.value, text.value, {
      format: format.value,
      displayValue: true,
      height: 80,
      margin: 10,
    })
    setOutput(new XMLSerializer().serializeToString(svgRef.value))
  } catch (e) {
    const tip = FORMAT_HINTS[format.value] || ''
    const msg = e instanceof Error ? e.message : '生成失败'
    setError(tip ? `${msg}。${tip}` : msg)
  }
}

function downloadSvg() {
  if (!import.meta.client || !output.value) return
  const blob = new Blob([output.value], { type: 'image/svg+xml;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'barcode.svg'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

onMounted(() => run())
</script>

<template>
  <UiToolShell title="条形码生成" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <button type="button" class="btn btn-ghost" :disabled="!output" @click="downloadSvg">下载 SVG</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>格式
          <select v-model="format" class="sel" @change="run">
            <option>CODE128</option>
            <option>EAN13</option>
            <option>EAN8</option>
            <option>UPC</option>
            <option>CODE39</option>
          </select>
        </label>
      </div>
      <p v-if="formatHint" class="hint">{{ formatHint }}</p>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <input v-model="text" class="inp" style="width:100%;margin-bottom:8px" @change="run" />
      <div class="preview" style="background:#fff"><svg ref="svgRef" /></div>
    </template>
    <template #output>
      <label class="lbl">SVG</label>
      <textarea :value="output" class="ta" rows="8" readonly />
    </template>
  </UiToolShell>
</template>
