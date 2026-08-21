<script setup lang="ts">
import {
  GRPC_CONTENT_TYPES,
  GRPC_STATUS_CODES,
  grpcBase64ToBytes,
  grpcBuildCurlCommand,
  grpcDecodeProtobuf,
  grpcEncodeSimpleJson,
  grpcHexToBytes,
  type KvPair,
} from '#shared/debug/grpc'

const { error, setError, clearError } = useToolState()
const tab = ref<'meta' | 'pb' | 'status'>('meta')

const endpoint = ref('https://grpc.example.com/helloworld.Greeter/SayHello')
const contentType = ref<string>('application/grpc+proto')
const bodyMode = ref<'base64' | 'json'>('base64')
const requestBase64 = ref('')
const requestJson = ref('{"name":"Ada"}')
const requestSchema = ref('message Request { string name = 1; }')
const meta = ref<KvPair[]>([
  ['authorization', 'Bearer xxx'],
  ['x-request-id', ''],
])
const metaOutput = ref('点击「生成 gRPC 请求命令」查看结果')

const pbInput = ref('')
const pbOutput = ref('粘贴 Base64 / Hex 后解码')

function addMeta(k = '', v = '') {
  meta.value.push([k, v])
}
function removeMeta(i: number) {
  meta.value.splice(i, 1)
  if (!meta.value.length) meta.value.push(['', ''])
}

function buildMetaCmd() {
  clearError()
  try {
    if (!endpoint.value.trim()) throw new Error('请输入目标服务地址')
    let messageBytes: Uint8Array
    if (bodyMode.value === 'base64') {
      messageBytes = grpcBase64ToBytes(requestBase64.value)
    } else {
      const json = JSON.parse(requestJson.value)
      messageBytes = grpcEncodeSimpleJson(json, requestSchema.value)
    }
    const pairs = meta.value.filter(([k]) => k.trim()) as KvPair[]
    metaOutput.value = grpcBuildCurlCommand(endpoint.value.trim(), contentType.value, pairs, messageBytes)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    metaOutput.value = '请求体生成失败: ' + msg
    setError(msg)
  }
}

function parsePb(mode: 'base64' | 'hex') {
  clearError()
  try {
    if (!pbInput.value.trim()) throw new Error(mode === 'base64' ? '请输入 Base64 字符串' : '请输入 Hex 字符串')
    const bytes = mode === 'base64' ? grpcBase64ToBytes(pbInput.value) : grpcHexToBytes(pbInput.value)
    pbOutput.value = grpcDecodeProtobuf(bytes)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    pbOutput.value = '解析失败: ' + msg
    setError(msg)
  }
}
</script>

<template>
  <UiToolShell title="gRPC 调试" :error="error" :dual="false">
    <template #actions>
      <button v-if="tab === 'meta'" type="button" class="btn" @click="buildMetaCmd">生成命令</button>
      <button v-else-if="tab === 'pb'" type="button" class="btn" @click="parsePb('base64')">解码 Base64</button>
      <UiCopyButton v-if="tab === 'meta'" :text="metaOutput" />
      <UiCopyButton v-else-if="tab === 'pb'" :text="pbOutput" />
    </template>

    <div class="tabs">
      <button type="button" class="tab" :class="{ active: tab === 'meta' }" @click="tab = 'meta'">
        Metadata 构造
      </button>
      <button type="button" class="tab" :class="{ active: tab === 'pb' }" @click="tab = 'pb'">
        Protobuf 解码
      </button>
      <button type="button" class="tab" :class="{ active: tab === 'status' }" @click="tab = 'status'">
        状态码速查
      </button>
    </div>

    <div v-show="tab === 'meta'" class="grpc-layout">
      <div class="left">
        <p class="hint">浏览器不直接支持标准 HTTP/2 gRPC；此处只生成带 5-byte gRPC frame 的命令。</p>
        <div class="mode-row">
          <label><input v-model="bodyMode" type="radio" value="base64" /> Protobuf Base64</label>
          <label><input v-model="bodyMode" type="radio" value="json" /> JSON + Proto Schema</label>
        </div>
        <textarea
          v-if="bodyMode === 'base64'"
          v-model="requestBase64"
          class="ta"
          rows="5"
          placeholder="消息 Protobuf bytes 的 Base64（不含 5-byte gRPC frame）"
        />
        <template v-else>
          <textarea v-model="requestJson" class="ta" rows="4" placeholder='{"name":"Ada"}' />
          <textarea
            v-model="requestSchema"
            class="ta"
            rows="3"
            style="margin-top: 8px"
            placeholder="message Request { string name = 1; }"
          />
          <p class="hint">简易编码器支持 string / int32 / int64 / bool / bytes 顶层字段</p>
        </template>

        <label class="lbl">Metadata</label>
        <div v-for="(row, i) in meta" :key="i" class="kv-row">
          <input v-model="meta[i]![0]" class="inp" placeholder="Key" />
          <input v-model="meta[i]![1]" class="inp" placeholder="Value" />
          <button type="button" class="btn btn-ghost sm" @click="removeMeta(i)">✕</button>
        </div>
        <button type="button" class="btn btn-ghost sm" @click="addMeta()">+ 添加 Metadata</button>

        <div class="row" style="margin-top: 10px">
          <input v-model="endpoint" class="inp grow" placeholder="目标服务地址" />
          <select v-model="contentType" class="sel">
            <option v-for="ct in GRPC_CONTENT_TYPES" :key="ct" :value="ct">{{ ct }}</option>
          </select>
        </div>
      </div>
      <div class="right">
        <label class="lbl">输出</label>
        <pre class="out">{{ metaOutput }}</pre>
      </div>
    </div>

    <div v-show="tab === 'pb'" class="grpc-layout">
      <div class="left">
        <label class="lbl">Base64 / Hex 输入</label>
        <textarea v-model="pbInput" class="ta" rows="10" placeholder="粘贴 Protobuf Wire 数据…" />
        <div class="row">
          <button type="button" class="btn" @click="parsePb('base64')">解码 Base64</button>
          <button type="button" class="btn btn-ghost" @click="parsePb('hex')">解码 Hex</button>
        </div>
      </div>
      <div class="right">
        <label class="lbl">Wire 解码结果</label>
        <pre class="out">{{ pbOutput }}</pre>
      </div>
    </div>

    <div v-show="tab === 'status'" class="status-wrap">
      <table class="status-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in GRPC_STATUS_CODES" :key="c.code">
            <td>{{ c.code }}</td>
            <td><code>{{ c.name }}</code></td>
            <td>{{ c.desc }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </UiToolShell>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 12px;
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
.grpc-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  flex: 1 1 auto;
  min-height: 0;
  align-self: stretch;
  width: 100%;
}
@media (max-width: 900px) {
  .grpc-layout {
    grid-template-columns: 1fr;
  }
}
.hint {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0 0 8px;
}
.mode-row {
  display: flex;
  gap: 14px;
  margin-bottom: 8px;
  font-size: 13px;
}
.kv-row,
.row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.grow {
  flex: 1;
  min-width: 0;
}
.sel {
  width: 220px;
  max-width: 100%;
}
.sm {
  padding: 3px 10px;
  font-size: 0.75rem;
  min-height: 28px;
}
.out {
  margin: 0;
  padding: 10px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 480px;
  overflow: auto;
  min-height: 200px;
}
.status-wrap {
  overflow: auto;
}
.status-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.status-table th,
.status-table td {
  border: 1px solid var(--border);
  padding: 8px 10px;
  text-align: left;
}
.status-table th {
  background: rgba(0, 0, 0, 0.2);
}
.status-table code {
  font-size: 12px;
}
</style>
