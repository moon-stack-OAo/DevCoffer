/** JSON 格式化 / 压缩 / 校验 */

export type JsonFormatResult = {
    ok: boolean
    text: string
    error?: string
}

export function formatJson(input: string, space = 2): JsonFormatResult {
    const raw = input.trim()
    if (!raw) return { ok: false, text: '', error: '请输入 JSON' }
    try {
        const parsed = JSON.parse(raw)
        return { ok: true, text: JSON.stringify(parsed, null, space) }
    } catch (e) {
        return { ok: false, text: '', error: e instanceof Error ? e.message : 'JSON 解析失败' }
    }
}

export function minifyJson(input: string): JsonFormatResult {
    const raw = input.trim()
    if (!raw) return { ok: false, text: '', error: '请输入 JSON' }
    try {
        const parsed = JSON.parse(raw)
        return { ok: true, text: JSON.stringify(parsed) }
    } catch (e) {
        return { ok: false, text: '', error: e instanceof Error ? e.message : 'JSON 解析失败' }
    }
}

export function validateJson(input: string): JsonFormatResult {
    const raw = input.trim()
    if (!raw) return { ok: false, text: '', error: '请输入 JSON' }
    try {
        JSON.parse(raw)
        return { ok: true, text: 'JSON 有效' }
    } catch (e) {
        return { ok: false, text: '', error: e instanceof Error ? e.message : 'JSON 无效' }
    }
}
