/** 字节单位换算 SI(1000) / IEC(1024) */

const SI = [
    { key: 'B', label: 'B', exp: 0 },
    { key: 'KB', label: 'KB', exp: 1 },
    { key: 'MB', label: 'MB', exp: 2 },
    { key: 'GB', label: 'GB', exp: 3 },
    { key: 'TB', label: 'TB', exp: 4 },
    { key: 'PB', label: 'PB', exp: 5 },
]

const IEC = [
    { key: 'B', label: 'B', exp: 0 },
    { key: 'KiB', label: 'KiB', exp: 1 },
    { key: 'MiB', label: 'MiB', exp: 2 },
    { key: 'GiB', label: 'GiB', exp: 3 },
    { key: 'TiB', label: 'TiB', exp: 4 },
    { key: 'PiB', label: 'PiB', exp: 5 },
]

const ALIASES: Record<string, { base: number; exp: number }> = {
    b: { base: 1000, exp: 0 },
    byte: { base: 1000, exp: 0 },
    bytes: { base: 1000, exp: 0 },
    kb: { base: 1000, exp: 1 },
    k: { base: 1000, exp: 1 },
    mb: { base: 1000, exp: 2 },
    m: { base: 1000, exp: 2 },
    gb: { base: 1000, exp: 3 },
    g: { base: 1000, exp: 3 },
    tb: { base: 1000, exp: 4 },
    t: { base: 1000, exp: 4 },
    pb: { base: 1000, exp: 5 },
    p: { base: 1000, exp: 5 },
    kib: { base: 1024, exp: 1 },
    ki: { base: 1024, exp: 1 },
    mib: { base: 1024, exp: 2 },
    mi: { base: 1024, exp: 2 },
    gib: { base: 1024, exp: 3 },
    gi: { base: 1024, exp: 3 },
    tib: { base: 1024, exp: 4 },
    ti: { base: 1024, exp: 4 },
    pib: { base: 1024, exp: 5 },
    pi: { base: 1024, exp: 5 },
}

export function bytesizeUnits(base: 1000 | 1024) {
    return base === 1024 ? IEC : SI
}

function parseUnit(unit: string) {
    if (unit == null) return null
    const u = String(unit).trim().toLowerCase()
    if (!u) return null
    return ALIASES[u] || null
}

function formatNumber(n: number): string {
    if (!isFinite(n)) return 'NaN'
    if (n === 0) return '0'
    if (Number.isInteger(n) || Math.abs(n - Math.round(n)) < 1e-12) return String(Math.round(n))
    let s = n.toFixed(10).replace(/\.?0+$/, '')
    if (s === '0' && n > 0) s = n.toPrecision(12).replace(/\.?0+$/, '')
    return s
}

export function bytesizeToBytes(
    value: string | number,
    unit: string,
    forceBase?: number,
): { ok: boolean; bytes?: number; msg?: string } {
    const raw = value == null ? '' : String(value).trim()
    if (!raw) return { ok: false, msg: '请输入数值' }
    const num = Number(raw)
    if (!isFinite(num) || num < 0) return { ok: false, msg: '请输入有效的非负数值' }
    const parsed = parseUnit(unit)
    if (!parsed) return { ok: false, msg: '未知单位' }
    let base = parsed.base
    if ((forceBase === 1000 || forceBase === 1024) && parsed.exp > 0) base = forceBase
    const bytes = num * Math.pow(base, parsed.exp)
    if (!isFinite(bytes)) return { ok: false, msg: '数值过大，无法换算' }
    return { ok: true, bytes }
}

export function bytesizeConvert(value: string | number, unit: string, base: 1000 | 1024 = 1024) {
    const b = base === 1024 ? 1024 : 1000
    const r = bytesizeToBytes(value, unit, b)
    if (!r.ok) return r
    const list = b === 1024 ? IEC : SI
    const rows = list.map((u) => ({
        unit: u.label,
        value: formatNumber(r.bytes! / Math.pow(b, u.exp)),
        bytes: r.bytes!,
    }))
    return { ok: true as const, bytes: r.bytes!, rows, base: b as 1000 | 1024 }
}

export function bytesizeResultText(result: {
    ok: boolean
    rows?: { unit: string; value: string }[]
    base?: number
    bytes?: number
    msg?: string
}): string {
    if (!result || !result.ok) return (result && result.msg) || '换算失败'
    const mode = result.base === 1024 ? '1024 (IEC)' : '1000 (SI)'
    const lines = ['进制: ' + mode, '']
    for (const row of result.rows || []) lines.push(row.value + ' ' + row.unit)
    return lines.join('\n')
}

/** 人性化：字节 → 可读字符串 */
export function humanizeBytes(bytes: number, base: 1000 | 1024 = 1024): string {
    const b = base === 1000 ? 1000 : 1024
    const list = b === 1024 ? IEC : SI
    if (!isFinite(bytes) || bytes < 0) return '—'
    if (bytes === 0) return '0 B'
    let idx = 0
    let v = bytes
    while (idx < list.length - 1 && v >= b) {
        v /= b
        idx++
    }
    return formatNumber(v) + ' ' + list[idx]!.label
}