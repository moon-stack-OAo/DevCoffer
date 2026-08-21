/**
 * 浏览器剪贴板封装；仅客户端可用。
 */
export function useClipboard() {
    const copied = ref(false)
    let timer: ReturnType<typeof setTimeout> | null = null

    async function copy(text: string): Promise<boolean> {
        if (!import.meta.client) return false
        const value = text ?? ''
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(value)
            } else {
                const ta = document.createElement('textarea')
                ta.value = value
                ta.setAttribute('readonly', '')
                ta.style.position = 'fixed'
                ta.style.left = '-9999px'
                document.body.appendChild(ta)
                ta.select()
                document.execCommand('copy')
                document.body.removeChild(ta)
            }
            copied.value = true
            if (timer) clearTimeout(timer)
            timer = setTimeout(() => {
                copied.value = false
            }, 1500)
            return true
        } catch {
            copied.value = false
            return false
        }
    }

    onBeforeUnmount(() => {
        if (timer) clearTimeout(timer)
    })

    return { copied, copy }
}
