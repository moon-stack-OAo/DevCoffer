/** chmod 八进制 ↔ rwx */

export type ChmodResult = {
    ok: boolean
    octal?: string
    mode?: number
    special?: { setuid: boolean; setgid: boolean; sticky: boolean }
    rwx?: string
    parts?: { u: number; g: number; o: number }
    desc?: string
    msg?: string
    note?: string
}

function nToRwx(n: number): string {
    return (n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + (n & 1 ? 'x' : '-')
}

function formatChmodDesc(
    u: number,
    g: number,
    o: number,
    special?: { setuid: boolean; setgid: boolean; sticky: boolean },
): string {
    const bits = (n: number) => {
        const parts: string[] = []
        if (n & 4) parts.push('读')
        if (n & 2) parts.push('写')
        if (n & 1) parts.push('执行')
        return parts.length ? parts.join('/') : '无'
    }
    const lines = [
        '所有者(u): ' + bits(u) + ' (' + nToRwx(u) + ')',
        '所属组(g): ' + bits(g) + ' (' + nToRwx(g) + ')',
        '其他人(o): ' + bits(o) + ' (' + nToRwx(o) + ')',
    ]
    if (special) {
        const sp: string[] = []
        if (special.setuid) sp.push('setuid')
        if (special.setgid) sp.push('setgid')
        if (special.sticky) sp.push('sticky')
        if (sp.length) lines.push('特殊: ' + sp.join(', '))
    }
    return lines.join('\n')
}

export function chmodToRwx(mode: number): string {
    const specialBits = (mode >> 9) & 7
    const u = (mode >> 6) & 7
    const g = (mode >> 3) & 7
    const o = mode & 7
    const one = (n: number, specialType: string) => {
        const r = n & 4 ? 'r' : '-'
        const w = n & 2 ? 'w' : '-'
        let x: string
        if (specialType === 's') x = n & 1 ? 's' : 'S'
        else if (specialType === 't') x = n & 1 ? 't' : 'T'
        else x = n & 1 ? 'x' : '-'
        return r + w + x
    }
    return (
        one(u, specialBits & 4 ? 's' : '') +
        one(g, specialBits & 2 ? 's' : '') +
        one(o, specialBits & 1 ? 't' : '')
    )
}

export function chmodFromMode(mode: number): ChmodResult {
    const specialBits = (mode >> 9) & 7
    const perm = mode & 0o777
    const u = (perm >> 6) & 7
    const g = (perm >> 3) & 7
    const o = perm & 7
    const special = {
        setuid: !!(specialBits & 4),
        setgid: !!(specialBits & 2),
        sticky: !!(specialBits & 1),
    }
    const octalFull = specialBits
        ? specialBits.toString(8) + u.toString(8) + g.toString(8) + o.toString(8)
        : u.toString(8) + g.toString(8) + o.toString(8)
    return {
        ok: true,
        octal: octalFull,
        mode,
        special,
        rwx: chmodToRwx(mode),
        parts: { u, g, o },
        desc: formatChmodDesc(u, g, o, special),
    }
}

function parseChmodRwx(rwx: string): ChmodResult {
    let s = String(rwx).trim()
    if (s.length === 10 && (s[0] === '-' || s[0] === 'd' || s[0] === 'l')) s = s.slice(1)
    if (s.length !== 9) return { ok: false, msg: 'rwx 长度无效' }
    const trip = (str: string) => {
        let n = 0
        if (str[0] === 'r') n += 4
        if (str[1] === 'w') n += 2
        const x = str[2]
        if (x === 'x' || x === 's' || x === 't') n += 1
        return n
    }
    const uu = trip(s.slice(0, 3))
    const gg = trip(s.slice(3, 6))
    const oo = trip(s.slice(6, 9))
    let specialBits = 0
    if (s[2] === 's' || s[2] === 'S') specialBits |= 4
    if (s[5] === 's' || s[5] === 'S') specialBits |= 2
    if (s[8] === 't' || s[8] === 'T') specialBits |= 1
    const mode = (specialBits << 9) | (uu << 6) | (gg << 3) | oo
    return chmodFromMode(mode)
}

export function parseChmod(input: string | number): ChmodResult {
    let s = input == null ? '' : String(input).trim()
    if (!s) return { ok: false, msg: '请输入权限' }
    if (
        /^[-d]?[r-][w-][xsS-][r-][w-][xsS-][r-][w-][xtT-]$/.test(s) ||
        /^[r-][w-][xsS-][r-][w-][xsS-][r-][w-][xtT-]$/.test(s)
    ) {
        return parseChmodRwx(s)
    }
    s = s.replace(/^0o/i, '')
    if (!/^[0-7]{3,4}$/.test(s)) {
        return { ok: false, msg: '无效权限，请输入 644 / 0755 / rwxr-xr-x' }
    }
    if (s.length === 3) s = '0' + s
    return chmodFromMode(parseInt(s, 8))
}

export function formatChmodReport(input: string): string {
    const p = parseChmod(input)
    if (!p.ok) throw new Error(p.msg || '解析失败')
    return [
        `八进制: ${p.octal}`,
        `符号: ${p.rwx}`,
        `mode: ${p.mode}`,
        '',
        p.desc,
    ].join('\n')
}