/** URL 编解码（encodeURIComponent / decodeURIComponent） */

export function encodeUrl(text: string): string {
    return encodeURIComponent(text)
}

export function decodeUrl(text: string): string {
    if (!text) return ''
    try {
        return decodeURIComponent(text.replace(/\+/g, '%20'))
    } catch {
        throw new Error('URL 解码失败：存在非法百分号编码')
    }
}
