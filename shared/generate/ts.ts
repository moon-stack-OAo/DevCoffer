/** 时间戳 ↔ 日期 */

export type TsDetect = { kind: 'sec' | 'ms' | 'date' | null; ms?: number }

export function detectTs(input: string, direction: 'ts2date' | 'date2ts'): TsDetect {
    const s = String(input ?? '').trim()
    if (!s) return { kind: null }
    if (direction === 'ts2date') {
        if (/^-?\d{10}$/.test(s)) return { kind: 'sec', ms: Number(s) * 1000 }
        if (/^-?\d{13}$/.test(s)) return { kind: 'ms', ms: Number(s) }
        if (/^-?\d+(\.\d+)?$/.test(s)) {
            const n = Number(s)
            if (!isFinite(n)) return { kind: null }
            if (Math.abs(n) < 1e12) return { kind: 'sec', ms: n * 1000 }
            return { kind: 'ms', ms: n }
        }
        return { kind: null }
    }
    const d = new Date(s)
    if (!isNaN(d.getTime())) return { kind: 'date', ms: d.getTime() }
    return { kind: null }
}

export function formatInZone(date: Date, zone: string): string {
    try {
        const fmt = new Intl.DateTimeFormat('en-CA', {
            timeZone: zone || 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        })
        const parts = fmt.formatToParts(date)
        const get = (t: string) => parts.find((p) => p.type === t)?.value || '00'
        let hour = get('hour')
        if (hour === '24') hour = '00'
        return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`
    } catch {
        return date.toISOString().replace('T', ' ').slice(0, 19)
    }
}

export function tsFormat(ms: number, format: string, timezone = 'UTC'): string | null {
    const d = new Date(ms)
    if (isNaN(d.getTime())) return null
    switch (format) {
        case 'yyyy-MM-dd HH:mm:ss':
            return formatInZone(d, timezone)
        case 'ISO':
            return d.toISOString()
        case 'ms':
            return String(d.getTime())
        case 's':
            return String(Math.floor(d.getTime() / 1000))
        default:
            return null
    }
}

export function convertTimestamp(
    input: string,
    direction: 'ts2date' | 'date2ts',
    timezone = 'Asia/Shanghai',
): string {
    const det = detectTs(input, direction)
    if (det.kind === null || det.ms == null) {
        throw new Error(direction === 'ts2date' ? '期望 Unix 秒/毫秒数字' : '期望可解析日期字符串')
    }
    if (direction === 'ts2date') {
        const local = formatInZone(new Date(det.ms), timezone)
        const iso = new Date(det.ms).toISOString()
        return [
            `识别: ${det.kind}`,
            `毫秒: ${det.ms}`,
            `秒: ${Math.floor(det.ms / 1000)}`,
            `ISO: ${iso}`,
            `${timezone}: ${local}`,
        ].join('\n')
    }
    return [
        `毫秒: ${det.ms}`,
        `秒: ${Math.floor(det.ms / 1000)}`,
        `ISO: ${new Date(det.ms).toISOString()}`,
        `${timezone}: ${formatInZone(new Date(det.ms), timezone)}`,
    ].join('\n')
}