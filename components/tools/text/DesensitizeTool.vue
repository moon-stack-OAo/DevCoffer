<script setup lang="ts">
import { DS_RULES, desensitizeText } from '#shared/text/desensitize'

const SAMPLE = `联系人：张三
手机：13812345678
邮箱：zhangsan@example.com
身份证：110101199001011234
姓名：李四五`

const { input, output, error, setOutput, setError, clearError } = useToolState()
const mode = ref<'text' | 'json'>('text')
const selected = ref<string[]>(Object.keys(DS_RULES).filter((k) => k !== 'name'))
const fields = ref('')

function run() {
  clearError()
  try {
    if (!input.value) throw new Error('请输入待脱敏文本')
    if (!selected.value.length) throw new Error('请至少选择一种脱敏类型')
    const r = desensitizeText(input.value, {
      types: selected.value,
      mode: mode.value,
      jsonFields: fields.value
        .split(/[,，\s]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    })
    setOutput(r.text)
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}

function toggle(id: string) {
  if (selected.value.includes(id)) selected.value = selected.value.filter((x) => x !== id)
  else selected.value = [...selected.value, id]
}

function loadSample() {
  input.value = SAMPLE
  clearError()
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <UiToolShell title="数据脱敏" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">脱敏</button>
      <button type="button" class="btn btn-ghost" @click="loadSample">示例</button>
      <button type="button" class="btn btn-ghost" @click="clearAll">清空</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">「中文姓名」默认关闭；开启后会跳过「联系人/手机/邮箱」等标签词。</p>
      <div class="opts">
        <label>模式
          <select v-model="mode" class="sel">
            <option value="text">纯文本</option>
            <option value="json">JSON</option>
          </select>
        </label>
        <label v-for="(rule, id) in DS_RULES" :key="id">
          <input type="checkbox" :checked="selected.includes(id)" @change="toggle(id)" />
          {{ rule.name }}
        </label>
      </div>
    </template>
    <template #input>
      <div v-if="mode === 'json'" class="opts">
        <label style="flex:1">JSON 字段过滤（逗号分隔，空=全部）
          <input v-model="fields" class="sel" style="width:100%;margin-top:4px" placeholder="phone,email,name" />
        </label>
      </div>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="12" placeholder="含手机号/身份证/邮箱的文本…" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="12" readonly placeholder="脱敏结果…" />
    </template>
  </UiToolShell>
</template>
