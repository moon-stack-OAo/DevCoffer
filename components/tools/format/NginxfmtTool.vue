<script setup lang="ts">
import {
  formatNginx,
  minifyNginx,
  lintNginx,
  formatBlockStats,
  NFM_SAMPLE,
  type NginxLintIssue,
} from '#shared/format/nginxfmt'

const { input, output, error, setOutput, setError, clearError } = useToolState(NFM_SAMPLE)

const indent = ref('    ')
const status = ref('')
const statusErr = ref(false)
const stats = ref('')
const lintIssues = ref<NginxLintIssue[]>([])
const lintError = ref('')

function refreshMeta() {
  stats.value = formatBlockStats(input.value)
  lintError.value = ''
  if (!String(input.value || '').trim()) {
    lintIssues.value = []
    return
  }
  try {
    lintIssues.value = lintNginx(input.value)
  } catch (e) {
    lintIssues.value = []
    lintError.value = e instanceof Error ? e.message : 'Lint 失败'
  }
}

function setStatus(msg: string, isErr = false) {
  status.value = msg
  statusErr.value = isErr
}

function doFormat() {
  clearError()
  try {
    const formatted = formatNginx(input.value, { indent: indent.value })
    setOutput(formatted)
    setStatus('格式化完成，共 ' + formatted.split('\n').length + ' 行')
  } catch (e) {
    setError(e instanceof Error ? e.message : '格式化失败')
    setStatus('格式化失败: ' + (e instanceof Error ? e.message : '未知错误'), true)
  }
  refreshMeta()
}

function doMin() {
  clearError()
  try {
    const mini = minifyNginx(input.value)
    setOutput(mini)
    setStatus('已压缩: ' + mini.length + ' 字符')
  } catch (e) {
    setError(e instanceof Error ? e.message : '压缩失败')
    setStatus('压缩失败: ' + (e instanceof Error ? e.message : '未知错误'), true)
  }
  refreshMeta()
}

function loadSample() {
  input.value = NFM_SAMPLE
  clearError()
  doFormat()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
  lintIssues.value = []
  lintError.value = ''
  stats.value = ''
  setStatus('已清空')
}

onMounted(() => {
  doFormat()
})
</script>

<template>
  <UiToolShell title="Nginx 格式化" :error="error">
    <template #actions>
      <label class="opts-inline">
        缩进
        <select v-model="indent" class="sel">
          <option value="  ">2 空格</option>
          <option value="    ">4 空格</option>
          <option :value="'\t'">Tab</option>
        </select>
      </label>
      <button type="button" class="btn" @click="doFormat">格式化</button>
      <button type="button" class="btn btn-ghost" @click="doMin">压缩</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
      <span class="nfm-status" :class="{ 'is-err': statusErr }">{{ status }}</span>
    </template>
    <template #toolbar>
      <div class="nfm-toolbar-row">
        <span class="nfm-stats">{{ stats }}</span>
      </div>
      <p class="hint">
        简化版 nginx 配置美化器。自实现 tokenizer + AST；支持缩进选择 / 压缩 / 基础 lint。不解析
        include 外部文件；map / geo 等仅按语法解析。
      </p>
    </template>
    <template #input>
      <label class="lbl">Nginx 输入</label>
      <textarea
        v-model="input"
        class="ta"
        rows="12"
        placeholder="粘贴 nginx.conf 内容…"
        spellcheck="false"
      />
    </template>
    <template #output>
      <label class="lbl">格式化 / 压缩结果</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="结果…" />
    </template>
    <template #footer>
      <div class="nfm-lint-section">
        <div class="lbl">Lint 检查结果</div>
        <div class="nfm-lint-list">
          <span v-if="lintError" class="nfm-lint-bad">Lint 失败: {{ lintError }}</span>
          <span v-else-if="!lintIssues.length" class="nfm-lint-empty">未发现问题</span>
          <div
            v-for="(it, idx) in lintIssues"
            :key="idx"
            class="nfm-lint-item"
            :class="it.severity === 'error' ? 'nfm-lint-error' : 'nfm-lint-warn'"
          >
            <i
              class="bi"
              :class="it.severity === 'error' ? 'bi-x-circle-fill' : 'bi-exclamation-triangle-fill'"
            />
            <span class="nfm-lint-rule">[{{ it.rule }}]</span>
            <span class="nfm-lint-loc">{{ it.line > 0 ? '第 ' + it.line + ' 行' : '全局' }}</span>
            <span class="nfm-lint-msg">{{ it.msg }}</span>
            <code v-if="it.ctx" class="nfm-lint-ctx">{{ it.ctx }}</code>
          </div>
        </div>
      </div>
    </template>
  </UiToolShell>
</template>

<style scoped>
.opts-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--text-muted);
}
.opts-inline .sel {
  width: auto;
  min-width: 90px;
}
.nfm-toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.nfm-status.is-err {
  color: var(--danger);
}
.nfm-lint-section {
  width: 100%;
}
</style>
