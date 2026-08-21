/** 时区转换（Intl） */

export const TZ_COMMON = [
    'UTC',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Asia/Seoul',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Hong_Kong',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Moscow',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'Australia/Sydney',
    'Pacific/Auckland',
]

export function getLocalTimeZone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
        return 'UTC'
    }
}

export function validateZone(zone: string): boolean {
    if (!zone) return false
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: zone }).format(new Date())
        return true
    } catch {
        return false
    }
}

export function tzOffsetMinutes(date: Date, timeZone: string): number {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })
    const parts = fmt.formatToParts(date)
    const get = (type: string) => parts.find((p) => p.type === type)?.value
    let hour = parseInt(get('hour') || '0', 10)
    if (hour === 24) hour = 0
    const tzAsUTC = Date.UTC(
        parseInt(get('year') || '0', 10),
        parseInt(get('month') || '1', 10) - 1,
        parseInt(get('day') || '1', 10),
        hour,
        parseInt(get('minute') || '0', 10),
        parseInt(get('second') || '0', 10),
    )
    return Math.round((tzAsUTC - date.getTime()) / 60000)
}

export function formatInZoneZh(date: Date, zone: string): string {
    const fmt = new Intl.DateTimeFormat('zh-CN', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })
    return fmt.format(date)
}

/** 将「某时区墙钟时间」转为 UTC Date */
export function localInputToUTC(localStr: string, sourceZone: string): Date | null {
    const m = localStr.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/)
    if (!m) return null
    const [, y, mo, d, h, mi, s] = m
    const fakeUTC = new Date(Date.UTC(+y!, +mo! - 1, +d!, +h!, +mi!, +(s || 0)))
    const offset = tzOffsetMinutes(fakeUTC, sourceZone)
    return new Date(fakeUTC.getTime() - offset * 60000)
}

export function convertTimezone(
    localStr: string,
    sourceZone: string,
    targetZone: string,
): string {
    if (!validateZone(sourceZone)) throw new Error('源时区无效: ' + sourceZone)
    if (!validateZone(targetZone)) throw new Error('目标时区无效: ' + targetZone)
    const utc = localInputToUTC(localStr.trim(), sourceZone)
    if (!utc || isNaN(utc.getTime())) throw new Error('无法解析时间，格式如 2024-01-01T12:00:00')
    const srcOff = tzOffsetMinutes(utc, sourceZone)
    const tgtOff = tzOffsetMinutes(utc, targetZone)
    const fmtOff = (m: number) => {
        const sign = m >= 0 ? '+' : '-'
        const abs = Math.abs(m)
        return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
    }
    return [
        `源 (${sourceZone}): ${formatInZoneZh(utc, sourceZone)}  ${fmtOff(srcOff)}`,
        `目标 (${targetZone}): ${formatInZoneZh(utc, targetZone)}  ${fmtOff(tgtOff)}`,
        `UTC: ${utc.toISOString()}`,
        `毫秒: ${utc.getTime()}`,
    ].join('\n')
}