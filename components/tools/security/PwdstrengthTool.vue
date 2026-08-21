<script setup lang="ts">
import { evaluatePasswordStrength } from '#shared/security/pwdstrength'

const { input, output, error, setOutput, clearError } = useToolState()
/** 明文对照：独立变量，与密码双向同步 */
const plain = ref('')
const syncing = ref(false)
const result = computed(() => evaluatePasswordStrength(input.value))

watch(input, (v) => {
    if (syncing.value) return
    syncing.value = true
    plain.value = v
    syncing.value = false
})
watch(plain, (v) => {
    if (syncing.value) return
    syncing.value = true
    input.value = v
    syncing.value = false
})

watch(
    input,
    () => {
        clearError()
        const r = result.value
        setOutput(
            [
                `强度: ${r.label} (${r.score}/100)`,
                `长度: ${r.length}`,
                '',
                ...r.checks.map((c) => `${c.pass ? '✓' : '✗'} ${c.label}`),
                '',
                '建议:',
                ...r.suggestions.map((s) => '- ' + s),
            ].join('\n'),
        )
    },
    { immediate: true },
)

const barColor = computed(() => {
    const l = result.value.level
    if (l === 'very-strong' || l === 'strong') return 'var(--success)'
    if (l === 'medium') return 'var(--warning)'
    if (l === 'weak') return 'var(--danger)'
    return 'var(--text-faint)'
})
</script>

<template>
  <UiToolShell title="密码强度检测" :error="error">
    <template #actions>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">本地评估，密码不出浏览器</p>
    </template>
    <template #input>
      <label class="lbl">密码</label>
      <input v-model="input" type="password" class="inp" placeholder="输入密码…" autocomplete="off" />
      <label class="lbl" style="margin-top:10px">明文对照（可选）</label>
      <input v-model="plain" class="inp" placeholder="明文对照…" autocomplete="off" />
      <div class="bar-wrap">
        <div class="bar" :style="{ width: result.score + '%', background: barColor }" />
      </div>
      <p class="hint">{{ result.label }} · {{ result.score }}/100</p>
    </template>
    <template #output>
      <label class="lbl">报告</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>

<style scoped>
.bar-wrap {
  margin-top: 12px;
  height: 8px;
  border-radius: 4px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  overflow: hidden;
}
.bar { height: 100%; transition: width 0.2s; }
</style>
