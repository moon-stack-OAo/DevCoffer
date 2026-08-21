<script setup lang="ts">
import {
  WS_QUICK_TEMPLATES,
  wsByteLength,
  wsConnSummary,
  wsCreateEmptyStats,
  wsEntriesToText,
  wsEntryToText,
  wsFilterEntries,
  wsMakeEntry,
  wsParseProtocols,
  wsPreviewContent,
  wsStatsText,
  wsStatusLabel,
  wsStatusPillClass,
  wsTrimLogs,
  wsValidateUrl,
  type WsConnState,
  type WsLogEntry,
  type WsLogKind,
  type WsStats,
} from '#shared/debug/ws'

const { error, setError, clearError } = useToolState()
const { copy } = useClipboard()

const url = ref('wss://echo.websocket.events')
const protocolsRaw = ref('')
const msg = ref('hello')
const clearAfterSend = ref(true)
const entries = ref<WsLogEntry[]>([])
const status = ref<WsConnState>('closed')
const closeCode = ref<number | null>(null)
const settingsOpen = ref(false)
const autoScroll = ref(true)
const dirFilter = ref<'all' | WsLogKind>('all')
const kwFilter = ref('')
const expandedLogIds = ref<Record<number, boolean>>({})
const logEl = ref<HTMLElement | null>(null)
const stats = ref<WsStats>(wsCreateEmptyStats())
const statsTick = ref(0)

let sock: WebSocket | null = null
let logSeq = 0
let statsTimer: ReturnType<typeof setInterval> | null = null

const canConnect = computed(() => status.value === 'closed')
const canDisconnect = computed(
  () => status.value === 'connecting' || status.value === 'open' || status.value === 'closing',
)
const settingsLocked = computed(
  () => status.value === 'connecting' || status.value === 'open' || status.value === 'closing',
)
const statusText = computed(() => wsStatusLabel(status.value, closeCode.value))
const statusPillClass = computed(() => wsStatusPillClass(status.value))
const protocols = computed(() => wsParseProtocols(protocolsRaw.value))
const connSummary = computed(() => wsConnSummary(url.value, protocols.value))
const filteredLogs = computed(() => wsFilterEntries(entries.value, dirFilter.value, kwFilter.value))
const canSend = computed(() => status.value === 'open' && !!sock && sock.readyState === WebSocket.OPEN)
const urlPreviewError = computed(() => wsValidateUrl(url.value))
const statsText = computed(() => {
  void statsTick.value
  if (!stats.value.connectedAt && stats.value.recv === 0 && stats.value.sent === 0) return ''
  return wsStatsText(stats.value, Date.now())
})
const emptyTitle = computed(() => {
  if (entries.value.length === 0) {
    return status.value === 'open' ? '等待消息' : '尚未连接'
  }
  return '无匹配日志'
})
const emptyDesc = computed(() => {
  if (entries.value.length === 0) {
    return status.value === 'open'
      ? '在左侧输入消息并发送，收发内容会出现在这里'
      : '打开连接设置配置 URL，或直接连接公共 echo 服务'
  }
  return '试试调整方向筛选或关键字'
})

function startStatsTimer() {
  stopStatsTimer()
  statsTimer = setInterval(() => {
    statsTick.value += 1
  }, 1000)
}

function stopStatsTimer() {
  if (statsTimer) {
    clearInterval(statsTimer)
    statsTimer = null
  }
}

function resetStats(markConnected: boolean) {
  stats.value = {
    ...wsCreateEmptyStats(),
    connectedAt: markConnected ? Date.now() : null,
  }
  statsTick.value += 1
  if (markConnected) startStatsTimer()
  else stopStatsTimer()
}

function markStatsStopped() {
  if (stats.value.connectedAt != null && stats.value.stoppedAt == null) {
    stats.value = { ...stats.value, stoppedAt: Date.now() }
  }
  stopStatsTimer()
  statsTick.value += 1
}

function bumpRecv(content: string) {
  stats.value = {
    ...stats.value,
    recv: stats.value.recv + 1,
    recvBytes: stats.value.recvBytes + wsByteLength(content),
  }
}

function bumpSent(content: string) {
  stats.value = {
    ...stats.value,
    sent: stats.value.sent + 1,
    sentBytes: stats.value.sentBytes + wsByteLength(content),
  }
}

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

function append(kind: WsLogKind, content: string) {
  entries.value.push(wsMakeEntry(kind, content, ++logSeq))
  entries.value = wsTrimLogs(entries.value)
  scrollLogToBottom()
}

function openSettings() {
  settingsOpen.value = true
}

function closeSettings() {
  settingsOpen.value = false
}

function applyTemplate(body: string) {
  msg.value = body
}

function useEchoAndConnect() {
  url.value = 'wss://echo.websocket.events'
  protocolsRaw.value = ''
  connect()
}

function connect() {
  clearError()
  const err = wsValidateUrl(url.value)
  if (err) {
    setError(err)
    openSettings()
    return
  }
  const u = url.value.trim()
  const protos = protocols.value

  try {
    if (sock) {
      sock.onclose = null
      sock.onerror = null
      sock.onmessage = null
      sock.onopen = null
      try {
        sock.close()
      } catch {
        /* ignore */
      }
      sock = null
    }
    sock = protos.length ? new WebSocket(u, protos) : new WebSocket(u)
    status.value = 'connecting'
    closeCode.value = null
    resetStats(false)
    closeSettings()
    append('system', '正在连接 ' + u + (protos.length ? ' · protocols: ' + protos.join(', ') : ''))

    sock.onopen = () => {
      status.value = 'open'
      resetStats(true)
      const negotiated = sock?.protocol ? ' · 协商协议: ' + sock.protocol : ''
      append('system', '已连接到 ' + u + negotiated)
    }
    sock.onclose = (e) => {
      status.value = 'closed'
      closeCode.value = e.code
      markStatsStopped()
      append(
        'system',
        '连接已断开 (code:' + e.code + (e.reason ? ', reason:' + e.reason : '') + ')',
      )
      sock = null
    }
    sock.onerror = () => {
      setError('WebSocket 错误')
      append('system', '连接错误')
    }
    sock.onmessage = (e) => {
      const data = String(e.data)
      bumpRecv(data)
      append('in', data)
    }
  } catch (e) {
    status.value = 'closed'
    sock = null
    markStatsStopped()
    setError(e instanceof Error ? e.message : '连接失败')
  }
}

function send() {
  if (!canSend.value || !sock) {
    setError('未连接')
    return
  }
  const m = msg.value
  if (!m) return
  try {
    sock.send(m)
    bumpSent(m)
    append('out', m)
    if (clearAfterSend.value) msg.value = ''
    clearError()
  } catch (e) {
    setError(e instanceof Error ? e.message : '发送失败')
  }
}

function disconnect(log = true) {
  if (sock) {
    sock.onclose = null
    sock.onerror = null
    sock.onmessage = null
    sock.onopen = null
    status.value = 'closing'
    try {
      sock.close()
    } catch {
      /* ignore */
    }
    sock = null
  }
  status.value = 'closed'
  closeCode.value = null
  markStatsStopped()
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
  await copy(wsEntriesToText(list))
}

async function copyLogEntry(entry: WsLogEntry) {
  clearError()
  await copy(wsEntryToText(entry))
}

function isBodyLong(entry: WsLogEntry): boolean {
  return entry.content.length > 400
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

function displayContent(entry: WsLogEntry): string {
  return wsPreviewContent(entry.content, isLogExpanded(entry.id))
}

function resetFilters() {
  kwFilter.value = ''
  dirFilter.value = 'all'
}

function onSendKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    send()
  }
}

function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && settingsOpen.value) settingsOpen.value = false
}

onMounted(() => {
  if (typeof window !== 'undefined') window.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onGlobalKeydown)
  stopStatsTimer()
  disconnect(false)
})
</script>

<template>
  <UiToolShell title="WebSocket 面板" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" :disabled="!canConnect" @click="connect">连接</button>
      <button type="button" class="btn btn-ghost" :disabled="!canDisconnect" @click="disconnect()">断开</button>
      <span class="act-sep" aria-hidden="true" />
      <button type="button" class="btn btn-ghost" :disabled="!entries.length" @click="clearLog">清空</button>
      <button type="button" class="btn btn-ghost" :disabled="!filteredLogs.length" @click="copyLogs">复制</button>
    </template>

    <div class="ws-layout">
      <div class="ws-side">
        <div class="conn-bar">
          <div class="conn-main">
            <span class="status-pill" :class="statusPillClass">
              <span class="dot" aria-hidden="true" />
              {{ statusText }}
            </span>
            <div class="summary" :title="connSummary">{{ connSummary }}</div>
            <span v-if="statsText" class="stats">{{ statsText }}</span>
          </div>
          <button type="button" class="btn btn-ghost sm" @click="openSettings">连接设置</button>
        </div>

        <div class="panel sidebar">
          <div class="panel-head">
            <div class="panel-title">
              <span>快捷模板</span>
              <span class="badge soft">{{ WS_QUICK_TEMPLATES.length }}</span>
            </div>
          </div>
          <div class="tpl-list">
            <button
              v-for="t in WS_QUICK_TEMPLATES"
              :key="t.label"
              type="button"
              class="tpl-item"
              :title="t.body"
              @click="applyTemplate(t.body)"
            >
              <span class="tpl-label">{{ t.label }}</span>
              <code class="tpl-preview">{{ t.body }}</code>
            </button>
          </div>
          <p class="tpl-hint">点击填入发送框，可再编辑后发送</p>
        </div>

        <div class="block composer">
          <div class="panel-head compact">
            <div class="panel-title">
              发送
              <span class="muted">Ctrl/⌘ + Enter</span>
            </div>
            <label class="check">
              <input v-model="clearAfterSend" type="checkbox" />
              <span>发送后清空</span>
            </label>
          </div>
          <textarea
            v-model="msg"
            class="ta ws-body"
            rows="4"
            placeholder="输入要发送的文本消息"
            :disabled="!canSend"
            @keydown="onSendKeydown"
          />
          <div class="row composer-row">
            <button type="button" class="btn" :disabled="!canSend" @click="send">发送</button>
          </div>
        </div>

        <p class="hint footer-hint">
          浏览器原生 WebSocket；子协议在「连接设置」中配置。浏览器无法自定义任意握手 HTTP Header。
        </p>
      </div>

      <aside class="panel main" aria-label="消息日志">
        <div class="panel-head">
          <div class="panel-title">
            <span>消息日志</span>
            <span v-if="entries.length" class="badge soft">{{ filteredLogs.length }}/{{ entries.length }}</span>
          </div>
          <div class="panel-actions filters">
            <label class="check pin">
              <input v-model="autoScroll" type="checkbox" />
              <span>钉底</span>
            </label>
            <select v-model="dirFilter" class="sel dir-sel">
              <option value="all">全部方向</option>
              <option value="in">仅收</option>
              <option value="out">仅发</option>
              <option value="system">仅系统</option>
            </select>
            <input v-model="kwFilter" class="inp kw" placeholder="关键字" />
            <button
              v-if="kwFilter || dirFilter !== 'all'"
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
            <p class="empty-title">{{ emptyTitle }}</p>
            <p class="empty-desc">{{ emptyDesc }}</p>
            <div v-if="entries.length === 0 && status === 'closed'" class="empty-actions">
              <button type="button" class="btn sm" @click="openSettings">打开连接设置</button>
              <button type="button" class="btn btn-ghost sm" @click="useEchoAndConnect">连接 echo 示例</button>
            </div>
          </div>
          <div
            v-for="l in filteredLogs"
            :key="l.id"
            class="log-line"
            :class="l.kind"
          >
            <div class="log-head">
              <span class="dir-badge" :class="l.kind">
                {{ l.kind === 'in' ? 'IN' : l.kind === 'out' ? 'OUT' : 'SYS' }}
              </span>
              <span class="time">{{ l.time }}</span>
              <div class="log-actions">
                <button
                  v-if="isBodyLong(l)"
                  type="button"
                  class="btn btn-ghost xs"
                  @click="toggleLogExpand(l.id)"
                >
                  {{ isLogExpanded(l.id) ? '收起' : '展开' }}
                </button>
                <button type="button" class="btn btn-ghost xs" @click="copyLogEntry(l)">复制</button>
              </div>
            </div>
            <pre class="body">{{ displayContent(l) }}</pre>
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
              <span class="lbl"><span class="req">*</span>WebSocket URL</span>
              <input
                v-model="url"
                class="inp"
                placeholder="wss://echo.websocket.events"
                @keydown.enter.prevent="connect"
              />
              <span v-if="url.trim() && urlPreviewError" class="field-error">{{ urlPreviewError }}</span>
              <span v-else-if="url.trim()" class="field-ok">URL 格式有效</span>
            </label>
            <label class="field">
              <span class="lbl">
                子协议 (Sec-WebSocket-Protocol)
                <span class="muted">逗号或换行分隔</span>
              </span>
              <textarea
                v-model="protocolsRaw"
                class="ta"
                rows="3"
                placeholder="graphql-transport-ws&#10;chat, superchat"
              />
            </label>
            <p class="hint">
              浏览器 WebSocket API 不支持自定义任意握手 Header，仅支持 URL 与子协议列表。
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
.ws-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(300px, 0.95fr);
  gap: 14px;
  flex: 1 1 auto;
  min-height: 0;
  align-self: stretch;
  height: 100%;
  align-items: stretch;
  width: 100%;
}
@media (max-width: 1100px) {
  .ws-layout {
    grid-template-columns: 1fr;
    height: auto;
    overflow: auto;
  }
}
.ws-side {
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
.stats {
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-mono, ui-monospace, monospace);
  white-space: nowrap;
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
.panel {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-panel);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.panel.sidebar {
  flex: 1 1 auto;
  min-height: 140px;
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
.row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
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
  flex-shrink: 0;
}
.field-error {
  font-size: 12px;
  color: var(--danger);
}
.field-ok {
  font-size: 12px;
  color: var(--success);
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
.composer-row {
  justify-content: flex-end;
  margin-top: 8px;
}
.composer .ta,
.composer .ws-body {
  width: 100%;
  min-height: 88px;
  resize: vertical;
  font-family: var(--font-mono, ui-monospace, monospace);
}
.tpl-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  overflow: auto;
  flex: 1 1 auto;
  min-height: 0;
}
.tpl-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-soft);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.tpl-item:hover {
  border-color: color-mix(in srgb, var(--brand) 45%, var(--border));
  background: color-mix(in srgb, var(--brand) 8%, var(--bg-soft));
}
.tpl-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-strong);
}
.tpl-preview {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono, ui-monospace, monospace);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  background: transparent;
}
.tpl-hint {
  margin: 0;
  padding: 0 12px 10px;
  font-size: 11px;
  color: var(--text-faint, var(--text-muted));
  flex-shrink: 0;
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
  max-width: 280px;
  line-height: 1.5;
}
.empty-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 8px;
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
.log-line.in {
  background: color-mix(in srgb, var(--success) 8%, transparent);
  border-left-color: var(--success);
}
.log-line.out {
  background: color-mix(in srgb, var(--brand) 8%, transparent);
  border-left-color: var(--brand);
}
.log-line.system {
  color: var(--text-muted);
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
.dir-badge {
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.04em;
  padding: 1px 6px;
  border-radius: 4px;
  line-height: 1.4;
}
.dir-badge.in {
  color: var(--success);
  background: color-mix(in srgb, var(--success) 15%, transparent);
}
.dir-badge.out {
  color: var(--brand-strong);
  background: var(--brand-soft);
}
.dir-badge.system {
  color: var(--text-muted);
  background: var(--bg-soft);
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
</style>
