/** 进制转换 2–36 */

export function convertBase(
    value: string,
    fromBase: number | string,
    toBase: number | string,
): { ok: boolean; result?: string; dec?: number; msg?: string; precisionRisk?: boolean } {
    const raw = value == null ? '' : String(value).trim()
    if (!raw) return { ok: false, msg: '请输入数值' }
    const from = parseInt(String(fromBase), 10) || 10
    const to = parseInt(String(toBase), 10) || 16
    if (from < 2 || from > 36 || to < 2 || to > 36) return { ok: false, msg: '无效的进制' }
    const num = parseInt(raw, from)
    if (isNaN(num)) return { ok: false, msg: '无效的数值' }
    const absRaw = raw[0] === '-' || raw[0] === '+' ? raw.slice(1) : raw
    if (!absRaw) return { ok: false, msg: '无效的数值' }
    const roundTrip = Math.abs(num).toString(from).toUpperCase()
    const stripped = absRaw.replace(/^0+/, '') || '0'
    if (stripped.toUpperCase() !== roundTrip) return { ok: false, msg: '无效的数值' }
    const finalResult =
        num < 0 ? '-' + Math.abs(num).toString(to).toUpperCase() : num.toString(to).toUpperCase()
    const precisionRisk = !Number.isSafeInteger(num)
    return { ok: true, result: finalResult, dec: num, precisionRisk }
}
