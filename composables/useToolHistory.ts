import type { Tool } from '~/data/tools'

const FAV_KEY = 'devcoffer:favorites'
const RECENT_KEY = 'devcoffer:recent'
const MAX_RECENT = 24

function readIds(key: string): string[] {
    if (!import.meta.client) return []
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return []
        const arr = JSON.parse(raw)
        return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []
    } catch {
        return []
    }
}

function writeIds(key: string, ids: string[]) {
    if (!import.meta.client) return
    localStorage.setItem(key, JSON.stringify(ids))
}

const favoriteIds = ref<string[]>([])
const recentIds = ref<string[]>([])
/** 仅客户端挂载后为 true，避免 SSR/CSR 不一致 */
const ready = ref(false)

function hydrate() {
    if (!import.meta.client) return
    favoriteIds.value = readIds(FAV_KEY)
    recentIds.value = readIds(RECENT_KEY)
    ready.value = true
}

export function useToolHistory() {
    const { toolsById } = useToolsRegistry()

    onMounted(() => hydrate())

    const favorites = computed(() => {
        if (!ready.value) return [] as Tool[]
        return favoriteIds.value.map((id) => toolsById[id]).filter((t): t is Tool => !!t)
    })
    const recent = computed(() => {
        if (!ready.value) return [] as Tool[]
        return recentIds.value.map((id) => toolsById[id]).filter((t): t is Tool => !!t)
    })

    function isFavorite(id: string) {
        if (!ready.value) return false
        return favoriteIds.value.includes(id)
    }

    function toggleFavorite(id: string) {
        if (!import.meta.client) return
        if (!ready.value) hydrate()
        const next = favoriteIds.value.slice()
        const i = next.indexOf(id)
        if (i >= 0) next.splice(i, 1)
        else next.unshift(id)
        favoriteIds.value = next
        writeIds(FAV_KEY, next)
    }

    function addRecent(id: string) {
        if (!import.meta.client) return
        if (!ready.value) hydrate()
        const next = recentIds.value.filter((x) => x !== id)
        next.unshift(id)
        recentIds.value = next.slice(0, MAX_RECENT)
        writeIds(RECENT_KEY, recentIds.value)
    }

    return {
        ready,
        favoriteIds,
        recentIds,
        favorites,
        recent,
        isFavorite,
        toggleFavorite,
        addRecent,
    }
}
