<script setup lang="ts">
import { jmhProTemplate } from '#shared/codegen/templates'

const { input, output, error, setOutput, setError, clearError } = useToolState('Sample')

const modeAvg = ref(true)
const modeTp = ref(true)
const modeSample = ref(false)
const modeSs = ref(false)
const timeUnit = ref('MICROSECONDS')
const scope = ref('Thread')
const warmup = ref(2)
const measurement = ref(5)
const forks = ref(1)
const timeoutSec = ref(10)
const withGroup = ref(true)
const withCompilerControl = ref(true)
const withTimeout = ref(true)

function selectedModes(): string[] {
  const modes: string[] = []
  if (modeAvg.value) modes.push('AverageTime')
  if (modeTp.value) modes.push('Throughput')
  if (modeSample.value) modes.push('SampleTime')
  if (modeSs.value) modes.push('SingleShotTime')
  return modes.length ? modes : ['AverageTime']
}

function run() {
  clearError()
  try {
    setOutput(jmhProTemplate(input.value.trim() || 'Sample', {
      modes: selectedModes(),
      timeUnit: timeUnit.value,
      scope: scope.value,
      warmup: Number(warmup.value) || 2,
      measurement: Number(measurement.value) || 5,
      forks: Number(forks.value) || 1,
      timeoutSec: Number(timeoutSec.value) || 10,
      withGroup: withGroup.value,
      withCompilerControl: withCompilerControl.value,
      withTimeout: withTimeout.value,
    }))
  } catch (e) {
    setError(e instanceof Error ? e.message : '失败')
  }
}
</script>

<template>
  <UiToolShell title="JMH 进阶" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="run">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <div class="opts">
        <label><input v-model="modeAvg" type="checkbox" /> AverageTime</label>
        <label><input v-model="modeTp" type="checkbox" /> Throughput</label>
        <label><input v-model="modeSample" type="checkbox" /> SampleTime</label>
        <label><input v-model="modeSs" type="checkbox" /> SingleShotTime</label>
      </div>
      <div class="opts">
        <label>TimeUnit
          <select v-model="timeUnit" class="sel">
            <option value="NANOSECONDS">NANOSECONDS</option>
            <option value="MICROSECONDS">MICROSECONDS</option>
            <option value="MILLISECONDS">MILLISECONDS</option>
            <option value="SECONDS">SECONDS</option>
          </select>
        </label>
        <label>Scope
          <select v-model="scope" class="sel">
            <option value="Thread">Thread</option>
            <option value="Benchmark">Benchmark</option>
            <option value="Group">Group</option>
          </select>
        </label>
        <label>Warmup <input v-model.number="warmup" class="inp" type="number" min="1" style="width:64px" /></label>
        <label>Measurement <input v-model.number="measurement" class="inp" type="number" min="1" style="width:64px" /></label>
        <label>Forks <input v-model.number="forks" class="inp" type="number" min="1" style="width:64px" /></label>
      </div>
      <div class="opts">
        <label><input v-model="withGroup" type="checkbox" /> @Group</label>
        <label><input v-model="withCompilerControl" type="checkbox" /> @CompilerControl</label>
        <label><input v-model="withTimeout" type="checkbox" /> @Timeout</label>
        <label v-if="withTimeout">秒 <input v-model.number="timeoutSec" class="inp" type="number" min="1" style="width:64px" /></label>
      </div>
      <p class="hint">进阶骨架含多 Mode / Warmup / Measurement / Fork / Group / CompilerControl / Timeout。</p>
    </template>
    <template #input>
      <label class="lbl">类名前缀</label>
      <textarea v-model="input" class="ta" rows="3" />
    </template>
    <template #output>
      <label class="lbl">代码</label>
      <textarea :value="output" class="ta" rows="18" readonly />
    </template>
  </UiToolShell>
</template>
