<script setup lang="ts">
import { CORS_METHODS, corsBuildHeaders } from '#shared/generate/corsgen'

const originMode = ref<'star' | 'custom'>('star')
const origin = ref('https://app.example.com')
const credentials = ref(false)
const methods = ref(['GET', 'POST', 'OPTIONS'])
const allowHeaders = ref('Content-Type, Authorization')
const exposeHeaders = ref('')
const maxAge = ref(86400)
const { output, error, setOutput, setError, clearError } = useToolState()

function toggleMethod(m: string) {
    if (methods.value.includes(m)) methods.value = methods.value.filter((x) => x !== m)
    else methods.value = [...methods.value, m]
    run()
}

function run() {
    clearError()
    const r = corsBuildHeaders({
        originMode: originMode.value,
        origin: origin.value,
        credentials: credentials.value,
        methods: methods.value,
        allowHeadersCustom: allowHeaders.value,
        exposeHeadersCustom: exposeHeaders.value,
        maxAge: maxAge.value,
    })
    if (!r.ok) {
        setError(r.msg || '生成失败')
        return
    }
    setOutput(
        [
            '===== Headers =====',
            r.text,
            '',
            '===== Nginx =====',
            r.nginx,
            '',
            '===== Express =====',
            r.express,
        ].join('\n'),
    )
}

watch([originMode, origin, credentials, maxAge], () => run())
onMounted(() => run())
</script>

<template>
  <UiToolShell title="CORS 头生成" :error="error" :dual="false">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <div class="opts">
      <label><input v-model="originMode" type="radio" value="star" /> Origin *</label>
      <label><input v-model="originMode" type="radio" value="custom" /> 自定义 Origin</label>
      <label><input v-model="credentials" type="checkbox" /> Credentials</label>
      <label>Max-Age <input v-model.number="maxAge" type="number" class="num" /></label>
    </div>
    <input v-if="originMode === 'custom'" v-model="origin" class="inp" placeholder="https://…" />
    <div class="methods">
      <button
        v-for="m in CORS_METHODS"
        :key="m"
        type="button"
        class="chip"
        :class="{ active: methods.includes(m) }"
        @click="toggleMethod(m)"
      >
        {{ m }}
      </button>
    </div>
    <label class="lbl">Allow-Headers</label>
    <input v-model="allowHeaders" class="inp" @input="run" />
    <label class="lbl">Expose-Headers</label>
    <input v-model="exposeHeaders" class="inp" placeholder="X-Request-Id, Content-Disposition" @input="run" />
    <textarea :value="output" class="ta" rows="18" readonly style="margin-top:10px" />
  </UiToolShell>
</template>

<style scoped>
.methods {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 10px 0;
}
</style>
