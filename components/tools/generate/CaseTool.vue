<script setup lang="ts">
import { convertCase, convertCaseAll, type CaseType } from '#shared/generate/case'

const CASE_META: { key: CaseType; label: string }[] = [
    { key: 'camel', label: 'camelCase' },
    { key: 'pascal', label: 'PascalCase' },
    { key: 'snake', label: 'snake_case' },
    { key: 'kebab', label: 'kebab-case' },
    { key: 'upper', label: 'UPPER' },
    { key: 'lower', label: 'lower' },
    { key: 'constant', label: 'CONSTANT' },
]

const EXAMPLES = [
    'hello world',
    'user_name',
    'getUserById',
    'API_KEY',
    'foo-bar-baz',
    'XMLHttpRequest',
]

const { input, output, error, setOutput, setError, clearError } = useToolState('hello world')
const active = ref<CaseType>('camel')
const all = computed(() => (input.value ? convertCaseAll(input.value) : null))

function apply(type: CaseType) {
    clearError()
    active.value = type
    try {
        setOutput(convertCase(input.value, type))
    } catch (e) {
        setError(e instanceof Error ? e.message : '转换失败')
    }
}

function useExample(s: string) {
    input.value = s
}

watch(input, () => {
    if (input.value) {
        clearError()
        try {
            setOutput(convertCase(input.value, active.value))
        } catch {
            /* ignore */
        }
    } else {
        output.value = ''
    }
}, { immediate: true })
</script>

<template>
  <UiToolShell title="Case 转换" :error="error">
    <template #actions>
      <UiCopyButton :text="output" />
    </template>

    <template #input>
      <label class="lbl">输入</label>
      <input
        v-model="input"
        class="inp case-input"
        type="text"
        placeholder="hello world / user_name…"
        autocomplete="off"
        spellcheck="false"
      />
      <p class="hint">右侧点选任意格式即可写入输出，并可一键复制。</p>

      <div class="examples">
        <div class="examples-head">
          <span class="lbl">示例</span>
        </div>
        <div class="chips">
          <button
            v-for="ex in EXAMPLES"
            :key="ex"
            type="button"
            class="chip"
            :class="{ active: input === ex }"
            @click="useExample(ex)"
          >{{ ex }}</button>
        </div>
      </div>
    </template>

    <template #output>
      <div class="meta">
        <span class="meta-item">当前 · <b>{{ active }}</b></span>
      </div>
      <pre class="out">{{ output }}</pre>
      <ul v-if="all" class="cases">
        <li
          v-for="m in CASE_META"
          :key="m.key"
          class="case"
          :class="{ active: active === m.key }"
          @click="apply(m.key)"
        >
          <span class="case-key">{{ m.label }}</span>
          <span class="case-val">{{ all[m.key] }}</span>
        </li>
      </ul>
    </template>
  </UiToolShell>
</template>

<style scoped>
.case-input {
  flex: 0 0 auto;
  min-height: 0;
  font-family: var(--mono);
}
.hint {
  margin: 8px 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
  flex: 0 0 auto;
}
.examples {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.examples-head {
  flex: 0 0 auto;
}
.examples .lbl {
  margin: 0;
}
.examples .chips {
  margin: 0;
}
.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  flex: 0 0 auto;
}
.meta-item {
  font-size: 0.8rem;
  color: var(--text-muted);
}
.meta-item b {
  color: var(--brand);
  font-weight: 600;
}
.out {
  margin: 0 0 10px;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.9rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  flex: 0 0 auto;
  min-height: 3.2rem;
}
.cases {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
.case {
  display: grid;
  grid-template-columns: 7.5rem minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.case:hover {
  border-color: color-mix(in srgb, var(--brand) 45%, var(--border));
}
.case.active {
  border-color: var(--brand);
  background: color-mix(in srgb, var(--brand) 12%, transparent);
}
.case-key {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--brand);
  font-family: var(--mono);
}
.case-val {
  font-size: 0.86rem;
  color: var(--text);
  font-family: var(--mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
