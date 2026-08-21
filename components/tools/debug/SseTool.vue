<script setup lang="ts">
import {
  sseConnSummary,
  sseCreateParseState,
  sseEntriesToText,
  sseEntryKind,
  sseEntryToText,
  sseFeedLine,
  sseFilterEntries,
  sseFormatDataDisplay,
  sseMakeEntry,
  sseParseFilter,
  sseParseHeadersJson,
  sseShouldEmit,
  sseStatusLabel,
  sseStatusPillClass,
  sseTrimLogs,
  sseValidateUrl,
  type SseLogEntry,
  type SseStatusKind,
} from '#shared/debug/sse'

const url = ref('https://sse.dev/test')
const headersJson = ref('')
const filterRaw = ref('')
const entries = ref<SseLogEntry[]>([])
const status = ref<SseStatusKind>('disconnected')
const settingsOpen = ref(false)
const autoScroll = ref(true)
const typeFilter = ref<'all' | 'event' | 'system' | 'error'>('all')
const kwFilter = ref('')
const expandedLogIds = ref<Record<number, boolean>>({})
const logEl = ref<HTMLElement | null>(null)
let controller: AbortController | null = null
let logSeq = 0
let activeFilterTypes: string[] = []

const { error, setError, clearError } = useToolState()
const { copy } = useClipboard()

const canConnect = computed(() => status.value === 'disconnected' || status.value === 'error')
const canDisconnect = computed(
  () => status.value === 'connecting' || status.value === 'connected',
)
const settingsLocked = computed(
  () => status.value === 'connecting' || status.value === 'connected',
)
const statusText = computed(() => sseStatusLabel(status.value))
const statusPillClass = computed(() => sseStatusPillClass(status.value))
const filterTypes = computed(() => sseParseFilter(filterRaw.value))
const connSummary = computed(() => sseConnSummary(url.value, filterTypes.value))
const filteredLogs = computed(() =>
  sseFilterEntries(entries.value, typeFilter.value, kwFilter.value),
)

function scrollLogToBottom() {
  if (!autoScroll.value) return
  nextTick(() => {
    const el = logEl.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function onLogScroll() {
  const el = logEl.value
  if (!el) return
  autoScroll.value = el.scrollHeight - el.scrollTop - el.clientHeight < 48
}

function append(type: string, data: string, eventId: string | null = null) {
  entries.value.push(sseMakeEntry(type, data, eventId, ++logSeq))
  entries.value = sseTrimLogs(entries.value)
  scrollLogToBottom()
}

function openSettings() {
  settingsOpen.value = true
}

function closeSettings() {
  settingsOpen.value = false
}

async function connect() {
  clearError()
  const urlErr = sseValidateUrl(url.value)
  if (urlErr) {
    setError(urlErr)
    openSettings()
    return
  }
  let headers: Record<string, string> = {}
  try {
    headers = sseParseHeadersJson(headersJson.value)
  } catch (e) {
    setError(e instanceof Error ? e.message : '请求头 JSON 格式错误')
    openSettings()
    return
  }
  activeFilterTypes = sseParseFilter(filterRaw.value)
  const u = url.value.trim()

  disconnect(false)
  status.value = 'connecting'
  closeSettings()
  controller = new AbortController()
  const signal = controller.signal
  append('system', '正在连接 ' + u)

  try {
    const response = await fetch(u, {
      method: 'GET',
      headers: { Accept: 'text/event-stream', ...headers },
      signal,
    })
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ' ' + response.statusText)
    }
    if (!response.body) {
      throw new Error('响应无 body（可能被浏览器拦截或非流式）')
    }
    status.value = 'connected'
    append('system', '已连接到 ' + u)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    const state = sseCreateParseState()

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        append('system', '连接已关闭')
        status.value = 'disconnected'
        break
      }
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        const ev = sseFeedLine(state, line.replace(/\r$/, ''))
        if (ev && sseShouldEmit(ev.eventType, activeFilterTypes)) {
          append(ev.eventType, ev.data, ev.eventId)
        }
      }
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return
    const msg = e instanceof Error ? e.message : String(e)
    append('error', '连接失败: ' + msg)
    status.value = 'error'
    setError(msg)
  }
}

function disconnect(log = true) {
  if (controller) {
    controller.abort()
    controller = null
  }
  status.value = 'disconnected'
  if (log) append('system', '已手动断开')
}

function clearLog() {
  entries.value = []
  expandedLogIds.value = {}
}

async function copyLogs() {
  const list = filteredLogs.value
  if (!list.length) {
    setError('没有日志可复制')
    return
  }
  clearError()
  await copy(sseEntriesToText(list))
}

async function copyLogEntry(entry: SseLogEntry) {
  clearError()
  await copy(sseEntryToText(entry))
}

function isBodyLong(entry: SseLogEntry): boolean {
  return entry.data.length > 400
}

function isLogExpanded(id: number): boolean {
  return !!expandedLogIds.value[id]
}

function toggleLogExpand(id: number) {
  expandedLogIds.value = {
    ...expandedLogIds.value,
    [id]: !expandedLogIds.value[id],
  }
}

function displayContent(entry: SseLogEntry): string {
  const raw = sseFormatDataDisplay(entry.data)
  if (!isBodyLong(entry) || isLogExpanded(entry.id)) return raw
  return raw.slice(0, 400) + '…'
}

function resetFilters() {
  kwFilter.value = ''
  typeFilter.value = 'all'
}

function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && settingsOpen.value) settingsOpen.value = false
}

onMounted(() => {
  if (typeof window !== 'undefined') window.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onGlobalKeydown)
  disconnect(false)
})
</script>

<template>
  <UiToolShell title="SSE / EventSource" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" :disabled="!canConnect" @click="connect">连接</button>
      <button type="button" class="btn btn-ghost" :disabled="!canDisconnect" @click="disconnect()">断开</button>
      <span class="act-sep" aria-hidden="true" />
      <button type="button" class="btn btn-ghost" :disabled="!entries.length" @click="clearLog">清空</button>
      <button type="button" class="btn btn-ghost" :disabled="!filteredLogs.length" @click="copyLogs">复制</button>
    </template>

    <div class="sse-layout">
      <div class="sse-side">
        <div class="conn-bar">
          <div class="conn-main">
            <span class="status-pill" :class="statusPillClass">
              <span class="dot" aria-hidden="true" />
              {{ statusText }}
            </span>
            <div class="summary" :title="connSummary">{{ connSummary }}</div>
          </div>
          <button type="button" class="btn btn-ghost sm" @click="openSettings">连接设置</button>
        </div>

        <div class="block info-block">
          <div class="panel-head compact">
            <div class="panel-title">连接信息</div>
          </div>
          <dl class="info-list">
            <div class="info-row">
              <dt>URL</dt>
              <dd :title="url.trim() || '—'">{{ url.trim() || '—' }}</dd>
            </div>
            <div class="info-row">
              <dt>请求头</dt>
              <dd>{{ headersJson.trim() ? '已配置 JSON' : '无（仅 Accept: text/event-stream）' }}</dd>
            </div>
            <div class="info-row">
              <dt>事件过滤</dt>
              <dd>{{ filterTypes.length ? filterTypes.join(', ') : '全部事件' }}</dd>
            </div>
          </dl>
          <button type="button" class="btn btn-ghost sm edit-btn" @click="openSettings">编辑设置</button>
        </div>

        <p class="hint footer-hint">
          使用 fetch + ReadableStream 读取 <code>text/event-stream</code>，可带 Authorization 等自定义请求头；受浏览器 CORS 限制。
        </p>
      </div>

      <aside class="panel main" aria-label="事件日志">
        <div class="panel-head">
          <div class="panel-title">
            <span>事件日志</span>
            <span v-if="entries.length" class="badge soft">{{ filteredLogs.length }}/{{ entries.length }}</span>
          </div>
          <div class="panel-actions filters">
            <label class="check pin">
              <input v-model="autoScroll" type="checkbox" />
              <span>钉底</span>
            </label>
            <select v-model="typeFilter" class="sel dir-sel">
              <option value="all">全部类型</option>
              <option value="event">仅事件</option>
              <option value="system">仅系统</option>
              <option value="error">仅错误</option>
            </select>
            <input v-model="kwFilter" class="inp kw" placeholder="关键字" />
            <button
              v-if="kwFilter || typeFilter !== 'all'"
              type="button"
              class="btn btn-ghost sm"
              @click="resetFilters"
            >
              重置
            </button>
          </div>
        </div>
        <div ref="logEl" class="log" @scroll="onLogScroll">
          <div v-if="!filteredLogs.length" class="empty log-empty">
            <p class="empty-title">{{ entries.length === 0 ? '等待事件' : '无匹配日志' }}</p>
            <p class="empty-desc">
              {{
                entries.length === 0
                  ? '连接后 Server-Sent Events 会出现在这里'
                  : '试试调整类型筛选或关键字'
              }}
            </p>
          </div>
          <div
            v-for="e in filteredLogs"
            :key="e.id"
            class="log-line"
            :class="'type-' + sseEntryKind(e.type)"
          >
            <div class="log-head">
              <span class="type-badge" :class="'type-' + sseEntryKind(e.type)">{{ e.type }}</span>
              <span v-if="e.eventId" class="event-id">ID: {{ e.eventId }}</span>
              <span class="time">{{ e.timestamp }}</span>
              <div class="log-actions">
                <button
                  v-if="isBodyLong(e)"
                  type="button"
                  class="btn btn-ghost xs"
                  @click="toggleLogExpand(e.id)"
                >
                  {{ isLogExpanded(e.id) ? '收起' : '展开' }}
                </button>
                <button type="button" class="btn btn-ghost xs" @click="copyLogEntry(e)">复制</button>
              </div>
            </div>
            <pre class="body">{{ displayContent(e) }}</pre>
          </div>
        </div>
      </aside>
    </div>

    <div v-if="settingsOpen" class="modal-backdrop" @click.self="closeSettings">
      <div class="modal settings-modal" role="dialog" aria-modal="true" aria-label="连接设置">
        <div class="modal-header">
          <span>连接设置</span>
          <button type="button" class="icon-btn" aria-label="关闭" @click="closeSettings">×</button>
        </div>
        <div class="modal-body">
          <p v-if="settingsLocked" class="lock-hint">已连接时修改需断开后重新连接才生效</p>
          <fieldset class="form" :disabled="settingsLocked">
            <label class="field">
              <span class="lbl"><span class="req">*</span>SSE URL</span>
              <input
                v-model="url"
                class="inp"
                placeholder="https://sse.dev/test"
                @keydown.enter.prevent="connect"
              />
            </label>
            <label class="field">
              <span class="lbl">
                自定义请求头
                <span class="muted">JSON 对象</span>
              </span>
              <textarea
                v-model="headersJson"
                class="ta sse-headers"
                rows="4"
                placeholder='{"Authorization":"Bearer xxx"}'
              />
            </label>
            <label class="field">
              <span class="lbl">
                事件过滤
                <span class="muted">逗号分隔，空=全部</span>
              </span>
              <input v-model="filterRaw" class="inp" placeholder="message, update, notification" />
            </label>
            <p class="hint">
              连接使用 <code>Accept: text/event-stream</code>；自定义头会合并进去。跨域需服务端允许 CORS。
            </p>
          </fieldset>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" @click="closeSettings">关闭</button>
          <button type="button" class="btn" :disabled="!canConnect" @click="connect">连接</button>
        </div>
      </div>
    </div>
  </UiToolShell>
</template>

<style scoped>
.act-sep {
  width: 1px;
  height: 18px;
  background: var(--border);
  margin: 0 2px;
}
.sse-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(320px, 1.15fr);
  gap: 14px;
  flex: 1 1 auto;
  min-height: 0;
  align-self: stretch;
  height: 100%;
  align-items: stretch;
  width: 100%;
}
@media (max-width: 1100px) {
  .sse-layout {
    grid-template-columns: 1fr;
    height: auto;
    overflow: auto;
  }
}
.sse-side {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 2px;
}
.conn-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-soft);
  flex-wrap: wrap;
  flex-shrink: 0;
}
.conn-main {
  display: flex;
  gap: 10px;
  align-items: center;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}
.summary {
  flex: 1;
  min-width: 120px;
  font-size: 13px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono, ui-monospace, monospace);
}
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background: var(--bg-panel);
  color: var(--text-muted);
  border: 1px solid var(--border);
}
.status-pill .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.85;
}
.status-pill.connected {
  color: var(--success);
  background: color-mix(in srgb, var(--success) 12%, transparent);
  border-color: color-mix(in srgb, var(--success) 35%, transparent);
}
.status-pill.connecting {
  color: var(--warning);
  background: color-mix(in srgb, var(--warning) 12%, transparent);
  border-color: color-mix(in srgb, var(--warning) 35%, transparent);
}
.status-pill.connecting .dot {
  animation: pulse 1s ease-in-out infinite;
}
.status-pill.error {
  color: var(--danger);
  background: var(--danger-bg);
  border-color: var(--danger-border);
}
@keyframes pulse {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
}
.block {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  background: var(--bg-input, rgba(15, 23, 42, 0.35));
  flex-shrink: 0;
}
.info-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.info-row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 8px;
  align-items: baseline;
  font-size: 12px;
}
.info-row dt {
  margin: 0;
  color: var(--text-muted);
  font-weight: 500;
}
.info-row dd {
  margin: 0;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 12px;
}
.edit-btn {
  margin-top: 10px;
}
.panel {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-panel);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.panel.main {
  min-height: 0;
  height: 100%;
  align-self: stretch;
}
.panel-head {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-soft);
}
.panel-head.compact {
  padding: 0 0 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border);
  background: transparent;
}
.panel-title {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 13px;
  font-weight: 600;
}
.panel-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--brand-strong);
  background: var(--brand-soft);
  border: 1px solid color-mix(in srgb, var(--brand) 30%, transparent);
}
.badge.soft {
  color: var(--text-muted);
  background: var(--bg-soft);
  border-color: var(--border);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}
.lbl {
  font-size: 11px;
  color: var(--text-muted);
  margin: 0;
}
.req {
  color: var(--danger);
  margin-right: 2px;
}
.muted {
  color: var(--text-muted);
  font-weight: 400;
  font-size: 12px;
}
.hint {
  font-size: 12px;
  color: var(--text-muted);
}
.footer-hint {
  margin: 0;
  line-height: 1.5;
}
.footer-hint code {
  font-size: 11px;
}
.sm {
  padding: 2px 8px;
  font-size: 0.75rem;
  min-height: 26px;
}
.xs {
  padding: 0 6px;
  font-size: 0.7rem;
  min-height: 22px;
}
.dir-sel {
  width: 110px;
}
.kw {
  width: 140px;
}
.check {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 28px 16px;
  text-align: center;
  flex: 1;
}
.empty-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
}
.empty-desc {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  max-width: 260px;
  line-height: 1.5;
}
.log-empty {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}
.log {
  flex: 1 1 0;
  min-height: 0;
  max-height: none;
  height: auto;
  overflow: auto;
  display: flex;
  flex-direction: column;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 12px;
  padding: 8px;
  background: var(--bg-panel);
  border: none;
  border-radius: 0;
  white-space: normal;
}
.log-line {
  margin-bottom: 6px;
  padding: 8px 10px;
  border-left: 3px solid transparent;
  border-radius: 0 8px 8px 0;
  background: var(--bg-soft);
  white-space: pre-wrap;
  word-break: break-word;
}
.log-line:hover {
  background: color-mix(in srgb, var(--brand) 6%, var(--bg-soft));
}
.log-line.type-message {
  background: color-mix(in srgb, var(--info, var(--brand)) 8%, transparent);
  border-left-color: var(--info, var(--brand));
}
.log-line.type-notification {
  background: color-mix(in srgb, var(--warning) 8%, transparent);
  border-left-color: var(--warning);
}
.log-line.type-other {
  background: color-mix(in srgb, var(--success) 8%, transparent);
  border-left-color: var(--success);
}
.log-line.type-system {
  color: var(--text-muted);
  border-left-color: var(--border);
}
.log-line.type-error {
  background: color-mix(in srgb, var(--danger) 8%, transparent);
  border-left-color: var(--danger);
}
.log-head {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 4px;
}
.log-actions {
  margin-left: auto;
  display: inline-flex;
  gap: 4px;
  align-items: center;
}
.type-badge {
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.02em;
  padding: 1px 6px;
  border-radius: 4px;
  line-height: 1.4;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.type-badge.type-message {
  color: var(--info, var(--brand-strong));
  background: color-mix(in srgb, var(--info, var(--brand)) 15%, transparent);
}
.type-badge.type-notification {
  color: var(--warning);
  background: color-mix(in srgb, var(--warning) 15%, transparent);
}
.type-badge.type-other {
  color: var(--success);
  background: color-mix(in srgb, var(--success) 15%, transparent);
}
.type-badge.type-system {
  color: var(--text-muted);
  background: var(--bg-soft);
}
.type-badge.type-error {
  color: var(--danger);
  background: color-mix(in srgb, var(--danger) 15%, transparent);
}
.event-id {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-soft);
  padding: 1px 6px;
  border-radius: 4px;
}
.time {
  color: var(--text-faint);
  font-size: 11px;
}
.body {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text);
  line-height: 1.45;
  font-family: inherit;
  font-size: inherit;
}
.icon-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.icon-btn:hover {
  background: var(--danger-bg);
  color: var(--danger);
}
.lock-hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--warning);
}
.form {
  border: none;
  margin: 0;
  padding: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.form:disabled {
  opacity: 0.72;
}
.form .field {
  margin-top: 0;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--bg) 35%, rgba(0, 0, 0, 0.55));
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
}
.modal {
  width: min(520px, 100%);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--shadow);
}
.modal.settings-modal {
  width: min(640px, 96vw);
  max-height: min(90vh, 680px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal.settings-modal .modal-body {
  overflow: auto;
  flex: 1 1 auto;
  min-height: 0;
}
.modal-header,
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.modal-header {
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 14px;
}
.modal-footer {
  margin-top: 14px;
  justify-content: flex-end;
}
.modal-body .ta {
  width: 100%;
}
.sse-headers {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 12px;
  resize: vertical;
  min-height: 88px;
}
</style>
