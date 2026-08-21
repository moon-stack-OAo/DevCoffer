<script setup lang="ts">
import { pbkdf2Derive } from '#shared/security/pbkdf2'
const password = ref('secret')
const salt = ref('')
const iterations = ref(100000)
const length = ref(32)
const hash = ref<'SHA-256'|'SHA-512'>('SHA-256')
const { output, error, setOutput, setError, clearError } = useToolState()
async function run() {
  clearError()
  try {
    const r = await pbkdf2Derive(password.value, salt.value, iterations.value, length.value, hash.value)
    setOutput(JSON.stringify(r, null, 2))
  } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="PBKDF2 派生" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">派生</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>Hash
          <select v-model="hash" class="sel">
            <option>SHA-256</option>
            <option>SHA-512</option>
          </select>
        </label>
      </div>
    </template>
    <template #input>
      <div class="grid2">
        <label class="lbl">口令 <input v-model="password" class="inp" /></label>
        <label class="lbl">Salt(Base64,空则随机) <input v-model="salt" class="inp" /></label>
        <label class="lbl">迭代 <input v-model.number="iterations" type="number" class="inp" /></label>
        <label class="lbl">字节长度 <input v-model.number="length" type="number" class="inp" /></label>
      </div>
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="12" readonly />
    </template>
  </UiToolShell>
</template>
