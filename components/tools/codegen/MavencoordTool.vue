<script setup lang="ts">
import { formatAllMaven } from '#shared/codegen/mavencoord'

const scope = ref('')
const { input, output, error, setOutput, setError, clearError } = useToolState('org.springframework.boot:spring-boot-starter-web:3.2.0')

function doGen() {
  clearError()
  try { setOutput(formatAllMaven(input.value, scope.value)) } catch (e) { setError(e instanceof Error ? e.message : '失败') }
}
</script>

<template>
  <UiToolShell title="Maven 坐标" :error="error">
    <template #actions>
      <button type="button" class="btn" @click="doGen">生成</button>
      <UiCopyButton :text="output" />
    </template>
    <template #toolbar>
      <p class="hint">支持 g:a:v 或 groupId= / artifactId= 多行。</p>
      <div class="opts">
        <label>scope
          <select v-model="scope" class="sel">
            <option value="">compile</option>
            <option value="provided">provided</option>
            <option value="runtime">runtime</option>
            <option value="test">test</option>
          </select>
        </label>
      </div>
    </template>
    <template #input>
      <label class="lbl">输入</label>
      <textarea v-model="input" class="ta" rows="8" />
    </template>
    <template #output>
      <label class="lbl">输出</label>
      <textarea :value="output" class="ta" rows="14" readonly />
    </template>
  </UiToolShell>
</template>

