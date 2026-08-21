<script setup lang="ts">
import {
  applyProxyUrl,
  BODY_TYPE_HINTS,
  buildCode,
  buildCurlFromConfig,
  buildErrorDiagnosis,
  buildFetchOpts,
  buildRequestConfig,
  clearHistory,
  compressJsonBody,
  deleteHistory,
  extractFilename,
  formatBytes,
  formatCurlOutput,
  formatJsonBody,
  HTTP_METHODS,
  isPreviewable,
  isTextType,
  loadHistory,
  parseCurl,
  PROXY_HEADER,
  PROXY_PATH,
  SAMPLE_REQUEST,
  saveHistory,
  type AuthState,
  type BodyType,
  type CodeLang,
  type CurlOpts,
  type HistoryItem,
  type KvPair,
  type RequestConfig,
} from '#shared/debug/httpdebug'

const { error, setError, clearError } = useToolState()

const method = ref('GET')
const url = ref('https://httpbin.org/get')
const headers = ref<KvPair[]>([['Content-Type', 'application/json']])
const queries = ref<KvPair[]>([['', '']])
const body = ref('')
const bodyType = ref<BodyType>('none')
const auth = reactive<AuthState>({ type: 'none' })
const curlOpts = reactive<CurlOpts>({
  follow: true,
  insecure: false,
  compressed: false,
  verbose: false,
  includeHeader: false,
  silent: false,
  timeout: '',
  ua: '',
})
const useProxy = ref(false)
const proxyAvailable = ref<boolean | null>(null)

const leftTab = ref<'params' | 'headers' | 'body' | 'auth' | 'options' | 'history'>('params')
const sideTab = ref<'response' | 'curl' | 'code'>('response')
const curlFmt = ref<'multi' | 'single'>('multi')
const codeLang = ref<CodeLang>('curl')
const curlInput = ref('')
const curlOutput = ref('点击「生成 cURL」查看结果')
const codeOutput = ref('点击「生成」或切换语言查看代码片段')
const history = ref<HistoryItem[]>([])

const sending = ref(false)
const respStatus = ref('')
const respStatusCls = ref('')
const respMeta = ref('')
const respBodyText = ref('')
const respEmpty = ref(true)
const respPreviewable = ref(false)
const respImageUrl = ref('')
const respErrorText = ref('')
const hasBlob = ref(false)
let lastBlob: Blob | null = null
let lastFilename = 'response.bin'
let abortCtrl: AbortController | null = null

const isBodyDisabled = computed(() => method.value === 'GET' || method.value === 'HEAD')
const paramsCount = computed(() => new Set(queries.value.filter(([k]) => k.trim()).map(([k]) => k)).size)
const headersCount = computed(() => new Set(headers.value.filter(([k]) => k.trim()).map(([k]) => k)).size)
const bodyHint = computed(() => BODY_TYPE_HINTS[bodyType.value])

function emptyKv(): KvPair {
  return ['', '']
}

function currentCfg(): RequestConfig {
  return buildRequestConfig({
    method: method.value,
    url: url.value,
    headers: headers.value.filter(([k]) => k.trim()),
    queries: queries.value.filter(([k]) => k.trim()),
    body: body.value,
    bodyType: bodyType.value,
    auth,
  })
}

function addHeader(k = '', v = '') {
  headers.value.push([k, v])
}
function addQuery(k = '', v = '') {
  queries.value.push([k, v])
}
function removeHeader(i: number) {
  headers.value.splice(i, 1)
  if (!headers.value.length) headers.value.push(emptyKv())
}
function removeQuery(i: number) {
  queries.value.splice(i, 1)
  if (!queries.value.length) queries.value.push(emptyKv())
}
function quickHeader(key: string, val: string) {
  const idx = headers.value.findIndex(([k]) => k.trim().toLowerCase() === key.toLowerCase())
  if (idx >= 0) {
    const cur = headers.value[idx]![1]
    headers.value[idx] = [key, val + cur.replace(/^Bearer\s*/i, '')]
  } else {
    addHeader(key, val)
  }
  leftTab.value = 'headers'
}

function generateCurl() {
  clearError()
  const cfg = currentCfg()
  if (!cfg.url) {
    setError('请输入 URL')
    curlOutput.value = '请输入 URL'
    return
  }
  const cmd = buildCurlFromConfig(cfg, { ...curlOpts })
  curlOutput.value = formatCurlOutput(cmd, curlFmt.value)
  sideTab.value = 'curl'
  generateCode(true)
}

function generateCode(silent = false) {
  const cfg = currentCfg()
  if (!cfg.url) {
    codeOutput.value = '请输入 URL'
    if (!silent) setError('请输入 URL')
    return
  }
  codeOutput.value = buildCode(cfg, codeLang.value, { ...curlOpts })
}

function setCodeLang(lang: CodeLang) {
  codeLang.value = lang
  generateCode(true)
}

async function probeProxy(): Promise<boolean> {
  try {
    const res = await fetch(PROXY_PATH, { method: 'GET', cache: 'no-store' })
    const by = (res.headers.get('x-proxied-by') || '').toLowerCase()
    const ok = by.includes(PROXY_HEADER)
    proxyAvailable.value = ok
    return ok
  } catch {
    proxyAvailable.value = false
    return false
  }
}

function abortInflight() {
  if (abortCtrl) {
    try {
      abortCtrl.abort()
    } catch {
      /* ignore */
    }
    abortCtrl = null
  }
}

async function sendRequest() {
  clearError()
  abortInflight()
  const cfg = currentCfg()
  if (!cfg.url) {
    setError('请输入 URL')
    return
  }

  const opts = buildFetchOpts(cfg, !!curlOpts.compressed)
  const headersObj = { ...(opts.headers as Record<string, string>) }
  if (
    !headersObj['Content-Type'] &&
    cfg.body &&
    cfg.bodyType !== 'raw' &&
    cfg.bodyType !== 'none' &&
    !cfg.isBodyDisabled
  ) {
    headersObj['Content-Type'] = 'application/json'
    opts.headers = headersObj
  }
  if (curlOpts.ua) {
    headersObj['User-Agent'] = String(curlOpts.ua)
    opts.headers = headersObj
  }

  respEmpty.value = false
  respStatus.value = '请求中...'
  respStatusCls.value = ''
  respMeta.value = ''
  respBodyText.value = ''
  respErrorText.value = ''
  respPreviewable.value = false
  if (respImageUrl.value) {
    URL.revokeObjectURL(respImageUrl.value)
    respImageUrl.value = ''
  }
  lastBlob = null
  hasBlob.value = false
  sideTab.value = 'response'
  sending.value = true

  const controller = new AbortController()
  abortCtrl = controller
  const timeoutMs = parseInt(String(curlOpts.timeout || ''), 10)
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs * 1000)
  }
  opts.signal = controller.signal

  let wantProxy = !!useProxy.value
  const start = performance.now()
  const cfgWithProxy = cfg as RequestConfig & { _usedProxy?: boolean }

  try {
    if (wantProxy) {
      const ok = await probeProxy()
      if (!ok) {
        wantProxy = false
        useProxy.value = false
        setError('本地代理不可用，已改为直连')
      }
    }
    const requestUrl = applyProxyUrl(cfg.url, wantProxy)
    cfgWithProxy._usedProxy = wantProxy
    const resp = await fetch(requestUrl, opts)

    if (wantProxy) {
      const by = (resp.headers.get('x-proxied-by') || '').toLowerCase()
      if (!by.includes(PROXY_HEADER)) {
        proxyAvailable.value = false
        const err = new Error(
          '本地 CORS 代理不可用。请关闭 Options 中的「通过本地代理」后重试。',
        ) as Error & { name: string }
        err.name = 'ProxyUnavailableError'
        throw err
      }
    }

    const elapsed = ((performance.now() - start) / 1000).toFixed(2)
    const code = resp.status
    respStatusCls.value =
      code < 300 ? 'status-2xx' : code < 400 ? 'status-3xx' : code < 500 ? 'status-4xx' : 'status-5xx'
    respStatus.value = code + ' ' + resp.statusText

    const contentType = (resp.headers.get('content-type') || '').toLowerCase().split(';')[0]!.trim()
    const disposition = resp.headers.get('content-disposition') || ''
    const blob = await resp.blob()
    lastBlob = blob
    hasBlob.value = true
    lastFilename = extractFilename(disposition, cfg.url, contentType)
    respMeta.value = elapsed + 's  |  ' + formatBytes(blob.size) + '  |  ' + (contentType || '-')
    respPreviewable.value = isPreviewable(contentType)

    if (isTextType(contentType) && blob.size < 5 * 1024 * 1024) {
      const text = await blob.text()
      try {
        respBodyText.value = JSON.stringify(JSON.parse(text), null, 2)
      } catch {
        respBodyText.value = text
      }
    } else {
      respBodyText.value =
        (contentType || '二进制文件') +
        ' 已就绪（' +
        formatBytes(blob.size) +
        '）\n' +
        (respPreviewable.value ? '可点击「打开」预览或「下载」保存' : '请点击「下载」保存文件')
      if (contentType.startsWith('image/')) {
        respImageUrl.value = URL.createObjectURL(blob)
      }
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    const isTimeout = err.name === 'TimeoutError' || /timeout|aborted/i.test(err.message)
    const isAbort = err.name === 'AbortError'
    respStatus.value =
      isTimeout && !isAbort
        ? '超时'
        : isAbort
          ? '已取消'
          : err.name === 'ProxyUnavailableError'
            ? '代理不可用'
            : '错误'
    respStatusCls.value = 'status-5xx'
    respMeta.value = ''
    respErrorText.value = buildErrorDiagnosis(err, cfgWithProxy)
    respBodyText.value = ''
    lastBlob = null
    hasBlob.value = false
    setError(err.name === 'ProxyUnavailableError' ? '本地代理不可用' : 'HTTP 请求失败')
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    if (abortCtrl === controller) abortCtrl = null
    sending.value = false
    history.value = saveHistory(cfg)
  }
}

function downloadResponse() {
  if (!lastBlob) return
  const a = document.createElement('a')
  a.href = URL.createObjectURL(lastBlob)
  a.download = lastFilename || 'response.bin'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 30_000)
}

function openInNewTab() {
  if (!lastBlob) return
  const u = URL.createObjectURL(lastBlob)
  window.open(u, '_blank')
  setTimeout(() => URL.revokeObjectURL(u), 60_000)
}

function parseCurlToForm() {
  clearError()
  const parsed = parseCurl(curlInput.value)
  if (!parsed.ok) {
    setError(parsed.error)
    return
  }
  method.value = parsed.method
  url.value = parsed.url || ''
  headers.value = parsed.headers.length ? parsed.headers.map((h) => [...h] as KvPair) : [emptyKv()]
  queries.value = parsed.queries.length ? parsed.queries.map((q) => [...q] as KvPair) : [emptyKv()]
  body.value = parsed.body || ''
  bodyType.value = parsed.bodyType || 'none'
  Object.assign(auth, { type: 'none', token: '', user: '', password: '', apiName: '', apiVal: '', apiLoc: 'header' })
  if (parsed.auth?.type === 'bearer') {
    auth.type = 'bearer'
    auth.token = parsed.auth.token || ''
  } else if (parsed.auth?.type === 'basic') {
    auth.type = 'basic'
    auth.user = parsed.auth.user || ''
    auth.password = parsed.auth.password || ''
  }
  const o = parsed.opts || {}
  curlOpts.follow = !!o.follow
  curlOpts.insecure = !!o.insecure
  curlOpts.compressed = !!o.compressed
  curlOpts.verbose = !!o.verbose
  curlOpts.includeHeader = !!o.includeHeader
  curlOpts.silent = !!o.silent
  curlOpts.timeout = o.timeout || ''
  curlOpts.ua = o.ua || ''
  generateCode(true)
  sideTab.value = 'curl'
}

function fillSample() {
  method.value = SAMPLE_REQUEST.method
  url.value = SAMPLE_REQUEST.url
  headers.value = SAMPLE_REQUEST.headers.map((h) => [...h] as KvPair)
  queries.value = SAMPLE_REQUEST.queries.map((q) => [...q] as KvPair)
  bodyType.value = SAMPLE_REQUEST.bodyType
  body.value = SAMPLE_REQUEST.body
  auth.type = 'none'
  curlOpts.follow = true
  curlOpts.compressed = true
  generateCurl()
}

function resetAll() {
  abortInflight()
  method.value = 'GET'
  url.value = ''
  headers.value = [['Content-Type', 'application/json']]
  queries.value = [emptyKv()]
  body.value = ''
  bodyType.value = 'none'
  auth.type = 'none'
  auth.token = ''
  auth.user = ''
  auth.password = ''
  auth.apiName = ''
  auth.apiVal = ''
  auth.apiLoc = 'header'
  curlOpts.follow = true
  curlOpts.insecure = false
  curlOpts.compressed = false
  curlOpts.verbose = false
  curlOpts.includeHeader = false
  curlOpts.silent = false
  curlOpts.timeout = ''
  curlOpts.ua = ''
  useProxy.value = proxyAvailable.value === true
  curlInput.value = ''
  curlOutput.value = '点击「生成 cURL」查看结果'
  codeOutput.value = '点击「生成」或切换语言查看代码片段'
  codeLang.value = 'curl'
  respEmpty.value = true
  respStatus.value = ''
  respBodyText.value = ''
  respErrorText.value = ''
  if (respImageUrl.value) {
    URL.revokeObjectURL(respImageUrl.value)
    respImageUrl.value = ''
  }
  lastBlob = null
  hasBlob.value = false
  clearError()
}

function doFormatJson() {
  const r = formatJsonBody(body.value)
  if (!r.ok) setError(r.error)
  else {
    body.value = r.text
    clearError()
  }
}
function doCompressJson() {
  const r = compressJsonBody(body.value)
  if (!r.ok) setError(r.error)
  else {
    body.value = r.text
    clearError()
  }
}

function restoreHistory(item: HistoryItem) {
  method.value = item.method || 'GET'
  url.value = item.url || ''
  headers.value = Array.isArray(item.headers) && item.headers.length
    ? item.headers.map((h) => [...h] as KvPair)
    : [emptyKv()]
  bodyType.value = item.bodyType || 'none'
  body.value = item.body != null ? String(item.body) : ''
  leftTab.value = 'params'
}

function onDeleteHistory(id: number) {
  history.value = deleteHistory(id)
}
function onClearHistory() {
  if (!confirm('确定清空所有历史记录？')) return
  clearHistory()
  history.value = []
}

function onUrlKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    sendRequest()
  }
}

onMounted(async () => {
  history.value = loadHistory()
  const ok = await probeProxy()
  if (ok) useProxy.value = true
})

onBeforeUnmount(() => {
  abortInflight()
  if (respImageUrl.value) URL.revokeObjectURL(respImageUrl.value)
})

watch(curlFmt, () => {
  if (curlOutput.value && !curlOutput.value.startsWith('点击') && !curlOutput.value.startsWith('请输入')) {
    const cfg = currentCfg()
    if (cfg.url) curlOutput.value = formatCurlOutput(buildCurlFromConfig(cfg, { ...curlOpts }), curlFmt.value)
  }
})
</script>

<template>
  <UiToolShell title="HTTP 调试" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" :disabled="sending" @click="sendRequest">
        {{ sending ? '请求中…' : '发送' }}
      </button>
      <button type="button" class="btn btn-ghost" @click="generateCurl">生成 cURL</button>
      <button type="button" class="btn btn-ghost" @click="fillSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="resetAll">重置</button>
      <button v-if="sending" type="button" class="btn btn-ghost" @click="abortInflight">取消</button>
    </template>

    <div class="http-topbar">
      <select v-model="method" class="method-sel" :class="'method-' + method">
        <option v-for="m in HTTP_METHODS" :key="m" :value="m">{{ m }}</option>
      </select>
      <input
        v-model="url"
        class="inp url-inp"
        placeholder="https://api.example.com/users"
        @keydown="onUrlKeydown"
      />
    </div>

    <div class="http-layout">
      <div class="http-form">
        <div class="tabs" role="tablist">
          <button
            type="button"
            class="tab"
            :class="{ active: leftTab === 'params' }"
            @click="leftTab = 'params'"
          >
            Params <span class="count">{{ paramsCount }}</span>
          </button>
          <button
            type="button"
            class="tab"
            :class="{ active: leftTab === 'headers' }"
            @click="leftTab = 'headers'"
          >
            Headers <span class="count">{{ headersCount }}</span>
          </button>
          <button type="button" class="tab" :class="{ active: leftTab === 'body' }" @click="leftTab = 'body'">
            Body
          </button>
          <button type="button" class="tab" :class="{ active: leftTab === 'auth' }" @click="leftTab = 'auth'">
            Auth
          </button>
          <button
            type="button"
            class="tab"
            :class="{ active: leftTab === 'options' }"
            @click="leftTab = 'options'"
          >
            Options
          </button>
          <button
            type="button"
            class="tab"
            :class="{ active: leftTab === 'history' }"
            @click="leftTab = 'history'"
          >
            历史
          </button>
        </div>

        <div v-show="leftTab === 'params'" class="panel">
          <p class="hint">Query 参数会自动拼接到 URL 的 <code>?</code> 后面</p>
          <div class="kv-head"><span>Key</span><span>Value</span><span /></div>
          <div v-for="(row, i) in queries" :key="'q' + i" class="kv-row">
            <input v-model="queries[i]![0]" class="inp" placeholder="参数名" />
            <input v-model="queries[i]![1]" class="inp" placeholder="参数值" />
            <button type="button" class="btn btn-ghost sm" @click="removeQuery(i)">✕</button>
          </div>
          <button type="button" class="btn btn-ghost sm" @click="addQuery()">+ 添加参数</button>
        </div>

        <div v-show="leftTab === 'headers'" class="panel">
          <p class="hint">常用 Header 可点击下方按钮快速添加</p>
          <div class="quick">
            <button type="button" class="btn btn-ghost sm" @click="quickHeader('Authorization', 'Bearer ')">
              + Authorization
            </button>
            <button
              type="button"
              class="btn btn-ghost sm"
              @click="quickHeader('Content-Type', 'application/json')"
            >
              + Content-Type
            </button>
            <button type="button" class="btn btn-ghost sm" @click="quickHeader('Accept', 'application/json')">
              + Accept
            </button>
            <button type="button" class="btn btn-ghost sm" @click="quickHeader('User-Agent', 'DevCoffer/1.0')">
              + User-Agent
            </button>
            <button type="button" class="btn btn-ghost sm" @click="quickHeader('Cookie', '')">+ Cookie</button>
          </div>
          <div class="kv-head"><span>Key</span><span>Value</span><span /></div>
          <div v-for="(row, i) in headers" :key="'h' + i" class="kv-row">
            <input v-model="headers[i]![0]" class="inp" placeholder="Header 名称" />
            <input v-model="headers[i]![1]" class="inp" placeholder="Header 值" />
            <button type="button" class="btn btn-ghost sm" @click="removeHeader(i)">✕</button>
          </div>
          <button type="button" class="btn btn-ghost sm" @click="addHeader()">+ 添加 Header</button>
        </div>

        <div v-show="leftTab === 'body'" class="panel" :class="{ disabled: isBodyDisabled }">
          <div class="row">
            <label class="lbl">类型</label>
            <select v-model="bodyType" class="sel" :disabled="isBodyDisabled">
              <option value="none">none</option>
              <option value="json">json (application/json)</option>
              <option value="form">form-urlencoded</option>
              <option value="text">text/plain</option>
              <option value="raw">raw</option>
            </select>
          </div>
          <div class="body-bar">
            <span class="hint">{{ bodyHint }}</span>
            <div class="body-acts">
              <button type="button" class="btn btn-ghost sm" :disabled="isBodyDisabled" @click="doFormatJson">
                美化 JSON
              </button>
              <button type="button" class="btn btn-ghost sm" :disabled="isBodyDisabled" @click="doCompressJson">
                压缩 JSON
              </button>
              <button
                type="button"
                class="btn btn-ghost sm"
                :disabled="isBodyDisabled"
                @click="body = ''"
              >
                清空
              </button>
            </div>
          </div>
          <textarea
            v-model="body"
            class="ta http-body"
            rows="6"
            :disabled="isBodyDisabled"
            placeholder='{"name":"张三","age":25}'
          />
        </div>

        <div v-show="leftTab === 'auth'" class="panel">
          <div class="row">
            <label class="lbl">类型</label>
            <select v-model="auth.type" class="sel">
              <option value="none">No Auth</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
              <option value="apikey">API Key</option>
            </select>
          </div>
          <div v-if="auth.type === 'bearer'" class="row">
            <label class="lbl">Token</label>
            <input v-model="auth.token" class="inp grow" placeholder="eyJhbGciOi..." />
          </div>
          <template v-else-if="auth.type === 'basic'">
            <div class="row">
              <label class="lbl">用户名</label>
              <input v-model="auth.user" class="inp grow" placeholder="username" />
            </div>
            <div class="row">
              <label class="lbl">密码</label>
              <input v-model="auth.password" class="inp grow" type="password" placeholder="password" />
            </div>
          </template>
          <template v-else-if="auth.type === 'apikey'">
            <div class="row">
              <label class="lbl">参数名</label>
              <input v-model="auth.apiName" class="inp grow" placeholder="X-API-Key" />
            </div>
            <div class="row">
              <label class="lbl">Value</label>
              <input v-model="auth.apiVal" class="inp grow" placeholder="key value" />
            </div>
            <div class="row">
              <label class="lbl">位置</label>
              <select v-model="auth.apiLoc" class="sel">
                <option value="header">Header 头</option>
                <option value="query">Query 参数</option>
              </select>
            </div>
          </template>
          <p class="hint">认证信息会作为 Header / Query 一起发送</p>
        </div>

        <div v-show="leftTab === 'options'" class="panel">
          <label class="opt"><input v-model="curlOpts.follow" type="checkbox" /> 跟随重定向 <code>-L</code></label>
          <label class="opt"><input v-model="curlOpts.insecure" type="checkbox" /> 跳过 SSL 验证 <code>-k</code></label>
          <label class="opt">
            <input v-model="curlOpts.compressed" type="checkbox" /> 请求压缩 (gzip) <code>--compressed</code>
          </label>
          <label class="opt"><input v-model="curlOpts.verbose" type="checkbox" /> 详细输出 <code>-v</code></label>
          <label class="opt">
            <input v-model="curlOpts.includeHeader" type="checkbox" /> 输出响应头 <code>-i</code>
          </label>
          <label class="opt"><input v-model="curlOpts.silent" type="checkbox" /> 静默模式 <code>-s</code></label>
          <label class="opt highlight" :title="proxyAvailable === false ? '当前无同源代理' : '同源代理绕过 CORS'">
            <input v-model="useProxy" type="checkbox" :disabled="proxyAvailable === false" />
            通过本地代理（解决 CORS）
            <code>__cors_proxy</code>
            <span v-if="proxyAvailable === true" class="proxy-ok">可用</span>
            <span v-else-if="proxyAvailable === false" class="proxy-no">不可用</span>
          </label>
          <label class="opt">
            超时 (秒)
            <input v-model="curlOpts.timeout" class="inp num" type="number" min="0" placeholder="30" />
            <code>--max-time</code>
          </label>
          <label class="opt">
            User-Agent
            <input v-model="curlOpts.ua" class="inp grow" placeholder="自定义 UA (可选)" />
            <code>-A</code>
          </label>
        </div>

        <div v-show="leftTab === 'history'" class="panel">
          <p class="hint">自动保存最近 50 条请求记录（敏感字段已脱敏）</p>
          <div v-if="!history.length" class="hist-empty">暂无历史记录</div>
          <div v-for="item in history" :key="item.id" class="hist-item" @click="restoreHistory(item)">
            <span class="hist-method" :class="(item.method || 'GET').toLowerCase()">{{ item.method }}</span>
            <span class="hist-url" :title="item.url">{{ item.url }}</span>
            <span class="hist-time">{{ item.time }}</span>
            <button type="button" class="btn btn-ghost sm" @click.stop="onDeleteHistory(item.id)">✕</button>
          </div>
          <button v-if="history.length" type="button" class="btn btn-ghost sm" @click="onClearHistory">
            清空历史
          </button>
        </div>
      </div>

      <div class="http-side">
        <div class="tabs" role="tablist">
          <button type="button" class="tab" :class="{ active: sideTab === 'response' }" @click="sideTab = 'response'">
            响应
          </button>
          <button type="button" class="tab" :class="{ active: sideTab === 'curl' }" @click="sideTab = 'curl'">
            cURL 命令
          </button>
          <button
            type="button"
            class="tab"
            :class="{ active: sideTab === 'code' }"
            @click="sideTab = 'code'; generateCode(true)"
          >
            代码
          </button>
        </div>

        <div v-show="sideTab === 'response'" class="side-panel">
          <div v-if="respEmpty" class="empty">
            <div class="empty-title">点击「发送」开始 HTTP 请求</div>
            <div class="hint">支持 GET / POST / PUT / DELETE 等，含 Auth / cURL 反向解析</div>
          </div>
          <div v-else class="resp">
            <div class="resp-head">
              <span class="resp-status" :class="respStatusCls">{{ respStatus }}</span>
              <span class="resp-meta">{{ respMeta }}</span>
              <div v-if="hasBlob" class="resp-acts">
                <button
                  v-if="respPreviewable"
                  type="button"
                  class="btn btn-ghost sm"
                  @click="openInNewTab"
                >
                  打开
                </button>
                <button type="button" class="btn btn-ghost sm" @click="downloadResponse">下载</button>
                <UiCopyButton v-if="respBodyText" :text="respBodyText" label="复制 Body" />
              </div>
            </div>
            <pre v-if="respErrorText" class="resp-body error">{{ respErrorText }}</pre>
            <template v-else>
              <img v-if="respImageUrl" :src="respImageUrl" class="resp-img" alt="preview" />
              <pre class="resp-body">{{ respBodyText }}</pre>
            </template>
          </div>
        </div>

        <div v-show="sideTab === 'curl'" class="side-panel">
          <div class="fmt-toggle">
            <button
              type="button"
              class="fmt-btn"
              :class="{ active: curlFmt === 'multi' }"
              @click="curlFmt = 'multi'"
            >
              多行
            </button>
            <button
              type="button"
              class="fmt-btn"
              :class="{ active: curlFmt === 'single' }"
              @click="curlFmt = 'single'"
            >
              单行
            </button>
            <UiCopyButton :text="curlOutput" label="复制" />
          </div>
          <pre class="out-box">{{ curlOutput }}</pre>
          <div class="parse-sec">
            <div class="parse-title">反向解析 cURL <span class="hint">粘贴已有命令自动填表</span></div>
            <textarea
              v-model="curlInput"
              class="ta"
              rows="5"
              placeholder="curl -X POST 'https://api.example.com/users' -H 'Content-Type: application/json' -d '{&quot;name&quot;:&quot;tom&quot;}'"
            />
            <div class="row">
              <button type="button" class="btn" @click="parseCurlToForm">解析到表单</button>
              <button type="button" class="btn btn-ghost" @click="curlInput = ''">清空</button>
            </div>
          </div>
        </div>

        <div v-show="sideTab === 'code'" class="side-panel">
          <div class="fmt-toggle">
            <button
              v-for="lang in (['curl', 'fetch', 'axios', 'java'] as CodeLang[])"
              :key="lang"
              type="button"
              class="fmt-btn"
              :class="{ active: codeLang === lang }"
              @click="setCodeLang(lang)"
            >
              {{ lang === 'java' ? 'Java' : lang === 'fetch' ? 'Fetch' : lang === 'axios' ? 'Axios' : 'cURL' }}
            </button>
            <button type="button" class="btn btn-ghost sm" @click="generateCode()">生成</button>
            <UiCopyButton :text="codeOutput" label="复制" />
          </div>
          <pre class="out-box">{{ codeOutput }}</pre>
          <p class="hint">根据左侧请求表单生成 cURL / Fetch / Axios / Java HttpClient 代码</p>
        </div>
      </div>
    </div>
  </UiToolShell>
</template>

<style scoped>
.http-topbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: stretch;
}
.method-sel {
  width: 110px;
  flex-shrink: 0;
  font-weight: 700;
  font-family: var(--font-mono, ui-monospace, monospace);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-input, rgba(15, 23, 42, 0.45));
  color: var(--text-strong);
  padding: 0 8px;
}
.url-inp {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono, ui-monospace, monospace);
}
.http-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  flex: 1 1 auto;
  min-height: 0;
  align-self: stretch;
  height: 100%;
  width: 100%;
}
@media (max-width: 960px) {
  .http-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
}
.http-form,
.http-side {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-input, rgba(15, 23, 42, 0.35));
  overflow: hidden;
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  border-bottom: 1px solid var(--border);
}
.tab {
  padding: 8px 12px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  font-size: 12px;
  margin-bottom: -1px;
}
.tab.active {
  color: var(--accent, #818cf8);
  border-bottom-color: var(--accent, #818cf8);
  font-weight: 600;
}
.count {
  font-size: 10px;
  opacity: 0.75;
  margin-left: 2px;
}
.panel,
.side-panel {
  padding: 10px 12px;
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.panel.disabled {
  opacity: 0.55;
}
.hint {
  font-size: 12px;
  color: var(--text-muted, #94a3b8);
  margin: 0 0 8px;
}
.kv-head,
.kv-row {
  display: grid;
  grid-template-columns: 1fr 1.4fr 36px;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
}
.kv-head {
  font-size: 11px;
  color: var(--text-muted);
  padding: 0 2px;
}
.quick {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.sm {
  padding: 3px 10px;
  font-size: 0.75rem;
  min-height: 28px;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.lbl {
  width: 64px;
  flex-shrink: 0;
  margin: 0;
  font-size: 12px;
}
.sel {
  width: 220px;
  max-width: 100%;
}
.grow {
  flex: 1;
  min-width: 0;
}
.num {
  width: 90px;
}
.body-bar {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.body-acts {
  display: flex;
  gap: 4px;
}
.http-body {
  width: 100%;
  min-height: 200px;
  max-height: 360px;
  height: 140px;
  resize: vertical;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 12px;
}
.opt {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.opt code {
  font-size: 11px;
  opacity: 0.7;
}
.opt.highlight {
  padding: 6px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--accent, #38bdf8) 10%, transparent);
}
.proxy-ok {
  color: #34d399;
  font-size: 11px;
}
.proxy-no {
  color: #f87171;
  font-size: 11px;
}
.hist-empty {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}
.hist-item {
  display: grid;
  grid-template-columns: 64px 1fr auto 28px;
  gap: 8px;
  align-items: center;
  padding: 8px 6px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  font-size: 12px;
}
.hist-item:hover {
  background: color-mix(in srgb, var(--accent, #818cf8) 8%, transparent);
}
.hist-method {
  font-weight: 700;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px;
}
.hist-method.get {
  color: #34d399;
}
.hist-method.post {
  color: #60a5fa;
}
.hist-method.put {
  color: #fbbf24;
}
.hist-method.delete {
  color: #f87171;
}
.hist-method.patch {
  color: #c084fc;
}
.hist-url {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono, ui-monospace, monospace);
}
.hist-time {
  color: var(--text-muted);
  font-size: 11px;
  white-space: nowrap;
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  text-align: center;
  gap: 8px;
}
.empty-title {
  font-weight: 600;
  color: var(--text-strong);
}
.resp-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.resp-status {
  font-weight: 700;
  font-family: var(--font-mono, ui-monospace, monospace);
}
.resp-status.status-2xx {
  color: #34d399;
}
.resp-status.status-3xx {
  color: #60a5fa;
}
.resp-status.status-4xx {
  color: #fbbf24;
}
.resp-status.status-5xx {
  color: #f87171;
}
.resp-meta {
  font-size: 12px;
  color: var(--text-muted);
}
.resp-acts {
  display: flex;
  gap: 4px;
  margin-left: auto;
}
.resp-body,
.out-box {
  margin: 0;
  padding: 10px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 420px;
  overflow: auto;
}
.resp-body.error {
  color: #fca5a5;
}
.resp-img {
  max-width: 100%;
  max-height: 240px;
  display: block;
  margin-bottom: 8px;
  border-radius: 6px;
}
.fmt-toggle {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
}
.fmt-btn {
  padding: 3px 10px;
  font-size: 11px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.fmt-btn.active {
  border-color: var(--accent, #38bdf8);
  color: var(--accent, #38bdf8);
  background: color-mix(in srgb, var(--accent, #38bdf8) 16%, transparent);
}
.parse-sec {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}
.parse-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}
</style>
