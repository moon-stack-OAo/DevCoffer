<script setup lang="ts">
import { formatChmodReport, parseChmod } from '#shared/generate/chmodcalc'

const { input, output, error, setOutput, setError, clearError } = useToolState('755')

function run() {
    clearError()
    try {
        setOutput(formatChmodReport(input.value))
    } catch (e) {
        setError(e instanceof Error ? e.message : '解析失败')
    }
}

function applyParts(
    parts: { u: number; g: number; o: number },
    special: { setuid: boolean; setgid: boolean; sticky: boolean },
) {
    const specialBits = (special.setuid ? 4 : 0) | (special.setgid ? 2 : 0) | (special.sticky ? 1 : 0)
    input.value = specialBits
        ? specialBits.toString(8) + parts.u.toString(8) + parts.g.toString(8) + parts.o.toString(8)
        : parts.u.toString(8) + parts.g.toString(8) + parts.o.toString(8)
    run()
}

function toggleBit(who: 'u' | 'g' | 'o', bit: 4 | 2 | 1) {
    const p = parseChmod(input.value)
    if (!p.ok || !p.parts) return
    const parts = { ...p.parts }
    parts[who] = parts[who]! & bit ? parts[who]! & ~bit : parts[who]! | bit
    applyParts(parts, {
        setuid: !!p.special?.setuid,
        setgid: !!p.special?.setgid,
        sticky: !!p.special?.sticky,
    })
}

function toggleSpecial(key: 'setuid' | 'setgid' | 'sticky') {
    const p = parseChmod(input.value)
    if (!p.ok || !p.parts) return
    const special = {
        setuid: !!p.special?.setuid,
        setgid: !!p.special?.setgid,
        sticky: !!p.special?.sticky,
    }
    special[key] = !special[key]
    applyParts({ ...p.parts }, special)
}

function setQuick(mode: string) {
    input.value = mode
    run()
}

const parsed = computed(() => parseChmod(input.value))
const presets = ['644', '755', '777', '700', '600', '4755', '2755', '1777'] as const

watch(input, () => run(), { immediate: true })
</script>

<template>
  <UiToolShell title="chmod 权限" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">解析</button>
      <button
        v-for="m in presets"
        :key="m"
        type="button"
        class="btn btn-ghost"
        @click="setQuick(m)"
      >{{ m }}</button>
      <UiCopyButton :text="output" />
    </template>
    <template #input>
      <label class="lbl">八进制或 rwx（如 755 / rwxr-xr-x / 4755）</label>
      <input v-model="input" class="inp" />
      <div v-if="parsed.ok && parsed.parts" class="bits">
        <div v-for="who in (['u', 'g', 'o'] as const)" :key="who" class="who">
          <span>{{ who }}</span>
          <button type="button" class="chip" :class="{ on: parsed.parts![who] & 4 }" @click="toggleBit(who, 4)">r</button>
          <button type="button" class="chip" :class="{ on: parsed.parts![who] & 2 }" @click="toggleBit(who, 2)">w</button>
          <button type="button" class="chip" :class="{ on: parsed.parts![who] & 1 }" @click="toggleBit(who, 1)">x</button>
        </div>
        <div class="who">
          <span>特殊</span>
          <button type="button" class="chip" :class="{ on: parsed.special?.setuid }" @click="toggleSpecial('setuid')">setuid</button>
          <button type="button" class="chip" :class="{ on: parsed.special?.setgid }" @click="toggleSpecial('setgid')">setgid</button>
          <button type="button" class="chip" :class="{ on: parsed.special?.sticky }" @click="toggleSpecial('sticky')">sticky</button>
        </div>
      </div>
    </template>
    <template #output>
      <label class="lbl">结果</label>
      <textarea :value="output" class="ta" rows="12" readonly />
    </template>
  </UiToolShell>
</template>

<style scoped>
.bits { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.who {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.chip.on {
  background: var(--brand-strong);
  border-color: var(--brand);
  color: var(--text-strong);
}
</style>
