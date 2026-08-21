<script setup lang="ts">
import {
  buildCacheControl,
  buildSetCookie,
  formatCookieParse,
} from '#shared/debug/cookiecache'

const mode = ref<'parse' | 'set' | 'cache'>('parse')
const { input, output, error, setOutput, setError, clearError } = useToolState(
  'session=abc; theme=dark',
)

const scName = ref('sid')
const scValue = ref('abc123')
const scPath = ref('/')
const scDomain = ref('')
const scMaxAge = ref('3600')
const scSameSite = ref('Lax')
const scSecure = ref(true)
const scHttpOnly = ref(true)

const ccNoStore = ref(false)
const ccNoCache = ref(false)
const ccPublic = ref(true)
const ccPrivate = ref(false)
const ccMaxAge = ref('3600')
const ccSMaxAge = ref('')
const ccImmutable = ref(false)

function runParse() {
  clearError()
  try {
    setOutput(formatCookieParse(input.value))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function runBuildSet() {
  clearError()
  try {
    setOutput(
      buildSetCookie({
        name: scName.value,
        value: scValue.value,
        path: scPath.value || undefined,
        domain: scDomain.value || undefined,
        maxAge: scMaxAge.value === '' ? undefined : scMaxAge.value,
        sameSite: scSameSite.value || undefined,
        secure: scSecure.value,
        httpOnly: scHttpOnly.value,
      }),
    )
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function runBuildCache() {
  clearError()
  try {
    const r = buildCacheControl({
      noStore: ccNoStore.value,
      noCache: ccNoCache.value,
      public: ccPublic.value && !ccPrivate.value,
      private: ccPrivate.value,
      maxAge: ccMaxAge.value === '' ? undefined : ccMaxAge.value,
      sMaxAge: ccSMaxAge.value === '' ? undefined : ccSMaxAge.value,
      immutable: ccImmutable.value,
    })
    setOutput([r.header, '', ...(r.notes.length ? ['说明:', ...r.notes.map((n) => '- ' + n)] : [])].join('\n'))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function run() {
  if (mode.value === 'parse') runParse()
  else if (mode.value === 'set') runBuildSet()
  else runBuildCache()
}
</script>

<template>
  <UiToolShell title="Cookie / Set-Cookie / Cache-Control" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">执行</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label><input v-model="mode" type="radio" value="parse" /> 解析</label>
        <label><input v-model="mode" type="radio" value="set" /> 构造 Set-Cookie</label>
        <label><input v-model="mode" type="radio" value="cache" /> 构造 Cache-Control</label>
      </div>
    </template>
    <template #input>
      <template v-if="mode === 'parse'">
        <label class="lbl">Cookie / Set-Cookie</label>
        <textarea v-model="input" class="ta" rows="8" />
      </template>
      <template v-else-if="mode === 'set'">
        <div class="grid2">
          <label class="lbl">Name <input v-model="scName" class="inp" style="width:100%" /></label>
          <label class="lbl">Value <input v-model="scValue" class="inp" style="width:100%" /></label>
          <label class="lbl">Path <input v-model="scPath" class="inp" style="width:100%" /></label>
          <label class="lbl">Domain <input v-model="scDomain" class="inp" style="width:100%" /></label>
          <label class="lbl">Max-Age <input v-model="scMaxAge" class="inp" style="width:100%" /></label>
          <label class="lbl">SameSite
            <select v-model="scSameSite" class="sel" style="width:100%">
              <option>Lax</option><option>Strict</option><option>None</option><option value="">(无)</option>
            </select>
          </label>
        </div>
        <div class="opts" style="margin-top:8px">
          <label><input v-model="scSecure" type="checkbox" /> Secure</label>
          <label><input v-model="scHttpOnly" type="checkbox" /> HttpOnly</label>
        </div>
      </template>
      <template v-else>
        <div class="opts">
          <label><input v-model="ccNoStore" type="checkbox" /> no-store</label>
          <label><input v-model="ccNoCache" type="checkbox" /> no-cache</label>
          <label><input v-model="ccPublic" type="checkbox" /> public</label>
          <label><input v-model="ccPrivate" type="checkbox" /> private</label>
          <label><input v-model="ccImmutable" type="checkbox" /> immutable</label>
        </div>
        <div class="grid2" style="margin-top:8px">
          <label class="lbl">max-age <input v-model="ccMaxAge" class="inp" style="width:100%" /></label>
          <label class="lbl">s-maxage <input v-model="ccSMaxAge" class="inp" style="width:100%" /></label>
        </div>
      </template>
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>
