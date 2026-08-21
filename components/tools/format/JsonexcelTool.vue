<script setup lang="ts">
import * as XLSX from 'xlsx'
import { JSONEXCEL_SAMPLE, toFriendlyJsonExcelError } from '#shared/format/jsonexcel'

const mode = ref<'j2x' | 'x2j'>('j2x')
const { input, output, error, setOutput, setError, clearError } = useToolState(JSONEXCEL_SAMPLE)
const downloadUrl = ref('')
const excelFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const statusHint = ref('')

function revokeDownload() {
  if (downloadUrl.value) {
    URL.revokeObjectURL(downloadUrl.value)
    downloadUrl.value = ''
  }
}

/** 切换模式时清空输出 / 错误 / 下载，避免残留 */
function resetModeState() {
  clearError()
  output.value = ''
  statusHint.value = ''
  revokeDownload()
  excelFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

watch(mode, () => {
  resetModeState()
})

function loadSample() {
  mode.value = 'j2x'
  input.value = JSONEXCEL_SAMPLE
  resetModeState()
}

function clearAll() {
  input.value = ''
  excelFile.value = null
  if (fileInput.value) fileInput.value.value = ''
  resetModeState()
}

function openPicker() {
  fileInput.value?.click()
}

function onPickFile(e: Event) {
  clearError()
  output.value = ''
  revokeDownload()
  const file = (e.target as HTMLInputElement).files?.[0] || null
  excelFile.value = file
  statusHint.value = file
    ? `已选择：${file.name}，点击「解析为 JSON」开始转换`
    : ''
}

function toSheet() {
  clearError()
  revokeDownload()
  const raw = input.value.trim()
  if (!raw) {
    setError('请输入 JSON（对象或对象数组）')
    return
  }
  try {
    const data = JSON.parse(raw)
    const rows = Array.isArray(data) ? data : [data]
    if (!rows.length) {
      setError('JSON 数组为空，无法生成 Excel')
      return
    }
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    downloadUrl.value = URL.createObjectURL(blob)
    setOutput('已生成 xlsx，共 ' + rows.length + ' 行，点击「下载 xlsx」')
  } catch (e) {
    setError(toFriendlyJsonExcelError(e, 'j2x'))
  }
}

function parseExcel() {
  clearError()
  output.value = ''
  if (!excelFile.value) {
    setError('请先选择 Excel / CSV 文件')
    return
  }
  const file = excelFile.value
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const wb = XLSX.read(reader.result, { type: 'array' })
      const name = wb.SheetNames[0]
      if (!name) {
        setError('工作簿中没有工作表')
        return
      }
      const sheet = wb.Sheets[name]!
      const json = XLSX.utils.sheet_to_json(sheet)
      setOutput(JSON.stringify(json, null, 2))
      statusHint.value = `已解析「${file.name}」，共 ${json.length} 行`
    } catch (err) {
      setError(toFriendlyJsonExcelError(err, 'x2j'))
    }
  }
  reader.onerror = () => setError('文件读取失败')
  reader.readAsArrayBuffer(file)
}

onBeforeUnmount(() => {
  revokeDownload()
})
</script>

<template>
  <UiToolShell title="JSON ↔ Excel" :error="error">
    <template #actions>
      <button v-if="mode === 'j2x'" type="button" class="btn" @click="toSheet">生成 Excel</button>
      <button v-else type="button" class="btn" @click="parseExcel">解析为 JSON</button>
      <a v-if="downloadUrl" class="btn btn-ghost" :href="downloadUrl" download="data.xlsx">下载 xlsx</a>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>模式
          <select v-model="mode" class="sel">
            <option value="j2x">JSON→Excel</option>
            <option value="x2j">Excel→JSON</option>
          </select>
        </label>
      </div>
      <p class="hint">
        {{ mode === 'j2x' ? '粘贴扁平 JSON 对象/数组，生成 xlsx' : '选择 xlsx / xls / csv，再点击「解析为 JSON」' }}
      </p>
    </template>
    <template #input>
      <template v-if="mode === 'j2x'">
        <label class="lbl">JSON 输入</label>
        <textarea
          v-model="input"
          class="ta"
          rows="12"
          spellcheck="false"
          placeholder='例如 [{"id":1,"name":"a"}]'
        />
      </template>
      <template v-else>
        <label class="lbl">Excel 文件</label>
        <div class="file-row">
          <button type="button" class="btn" @click="openPicker">选择文件</button>
          <span class="file-name">{{ excelFile ? excelFile.name : '未选择文件' }}</span>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
          class="hidden"
          @change="onPickFile"
        />
        <p v-if="!excelFile" class="empty-hint">请选择 Excel / CSV，再点击上方「解析为 JSON」</p>
        <p v-else-if="statusHint" class="hint">{{ statusHint }}</p>
      </template>
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea
        :value="output"
        class="ta"
        rows="12"
        readonly
        :placeholder="mode === 'j2x' ? '生成结果提示…' : '解析后的 JSON…'"
      />
    </template>
  </UiToolShell>
</template>

<style scoped>
.hidden {
  display: none;
}
.file-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.file-name {
  color: var(--text-muted);
  font-size: 0.86rem;
  word-break: break-all;
}
.empty-hint {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 0.86rem;
}
</style>
