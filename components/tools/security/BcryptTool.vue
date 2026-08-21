<script setup lang="ts">
import { bcryptCompare, bcryptHash } from '#shared/security/bcrypt'
const password = ref('password')
const rounds = ref(10)
const hash = ref('')
const { output, error, setOutput, setError, clearError } = useToolState()
function doHash() {
  clearError()
  try {
    hash.value = bcryptHash(password.value, rounds.value)
    setOutput(hash.value)
  } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
function doCompare() {
  clearError()
  try {
    const ok = bcryptCompare(password.value, hash.value || output.value)
    setOutput(ok ? '匹配: true' : '匹配: false')
  } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>
<template>
  <UiToolShell title="bcrypt" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doHash">Hash</button>
      <button type="button" class="btn btn-ghost" @click="doCompare">校验</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label>口令 <input v-model="password" class="inp" /></label>
        <label>rounds <input v-model.number="rounds" type="number" min="4" max="15" class="num" /></label>
      </div>
    </template>
    <template #input>
      <label class="lbl">已有 Hash（校验用）</label>
      <textarea v-model="hash" class="ta" rows="3" placeholder="$2a$10$..." />
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="8" readonly />
    </template>
  </UiToolShell>
</template>
