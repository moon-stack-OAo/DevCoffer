/** 日期加减 / 差 / 工作日 */

export type DateUnit = 'day' | 'week' | 'month' | 'year'

function pad2(n: number) {
    return String(n).padStart(2, '0')
}

export function formatDateYmd(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function formatDateTime(d: Date): string {
    return (
        formatDateYmd(d) +
        ' ' +
        pad2(d.getHours()) +
        ':' +
        pad2(d.getMinutes()) +
        ':' +
        pad2(d.getSeconds())
    )
}

export function dateAdd(base: string, amount: number, unit: DateUnit, op: 'add' | 'sub' = 'add'): string {
    if (!base) throw new Error('请选择基准日期')
    const d = new Date(base)
    if (isNaN(d.getTime())) throw new Error('无效日期')
    const sign = op === 'add' ? 1 : -1
    const n = Math.floor(amount) || 0
    if (unit === 'day') d.setDate(d.getDate() + sign * n)
    else if (unit === 'week') d.setDate(d.getDate() + sign * n * 7)
    else if (unit === 'month') d.setMonth(d.getMonth() + sign * n)
    else d.setFullYear(d.getFullYear() + sign * n)
    return formatDateYmd(d)
}

export function dateDiff(d1: string, d2: string, unit: DateUnit = 'day'): string {
    if (!d1 || !d2) throw new Error('请选择两个日期')
    const a = new Date(d1)
    const b = new Date(d2)
    if (isNaN(a.getTime()) || isNaN(b.getTime())) throw new Error('无效日期')
    const ms = Math.abs(b.getTime() - a.getTime())
    const map: Record<DateUnit, number> = {
        day: 86400000,
        week: 604800000,
        month: 2592000000,
        year: 31536000000,
    }
    const labels: Record<DateUnit, string> = { day: '天', week: '周', month: '月', year: '年' }
    return Math.round(ms / map[unit]) + ' ' + labels[unit]
}

export function bizDays(d1: string, d2: string): number {
    if (!d1 || !d2) throw new Error('请选择两个日期')
    const a = new Date(d1)
    const b = new Date(d2)
    if (isNaN(a.getTime()) || isNaN(b.getTime())) throw new Error('无效日期')
    let count = 0
    const cur = new Date(Math.min(a.getTime(), b.getTime()))
    const end = new Date(Math.max(a.getTime(), b.getTime()))
    while (cur <= end) {
        const day = cur.getDay()
        if (day !== 0 && day !== 6) count++
        cur.setDate(cur.getDate() + 1)
    }
    return count
}

export function bizDaysAdd(base: string, amount: number, op: 'add' | 'sub' = 'add'): string {
    if (!base) throw new Error('请选择基准日期')
    const d = new Date(base)
    if (isNaN(d.getTime())) throw new Error('无效日期')
    const sign = op === 'add' ? 1 : -1
    let n = Math.abs(Math.floor(amount) || 0)
    while (n > 0) {
        d.setDate(d.getDate() + sign)
        const day = d.getDay()
        if (day !== 0 && day !== 6) n--
    }
    return formatDateYmd(d)
}