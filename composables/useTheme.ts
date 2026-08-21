export type ThemeMode = 'dark' | 'light'

const STORAGE_KEY = 'devcoffer:theme'

const theme = ref<ThemeMode>('dark')
const ready = ref(false)

function readStored(): ThemeMode | null {
  if (!import.meta.client) return null
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

function applyTheme(mode: ThemeMode) {
  if (!import.meta.client) return
  document.documentElement.setAttribute('data-theme', mode)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', mode === 'light' ? '#f4f7fb' : '#0b1220')
}

function hydrate() {
  if (!import.meta.client || ready.value) return
  const stored = readStored()
  theme.value = stored || 'dark'
  applyTheme(theme.value)
  ready.value = true
}

export function useTheme() {
  onMounted(() => hydrate())

  const isDark = computed(() => theme.value === 'dark')
  const isLight = computed(() => theme.value === 'light')

  function setTheme(mode: ThemeMode) {
    theme.value = mode
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, mode)
      applyTheme(mode)
      ready.value = true
    }
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return {
    theme,
    ready,
    isDark,
    isLight,
    setTheme,
    toggleTheme,
  }
}
