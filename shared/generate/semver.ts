/** SemVer 解析与比较 */

export type SemverParts = {
    major: number
    minor: number
    patch: number
    prerelease: string[]
    build: string[]
    raw: string
    version: string
}

export function parseSemver(version: string): SemverParts | null {
    if (version == null) return null
    let s = String(version).trim()
    if (!s) return null
    if (s.charAt(0) === 'v' || s.charAt(0) === 'V') s = s.slice(1)
    const re =
        /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/
    const m = s.match(re)
    if (!m) return null
    return {
        major: parseInt(m[1]!, 10),
        minor: parseInt(m[2]!, 10),
        patch: parseInt(m[3]!, 10),
        prerelease: m[4] ? m[4].split('.') : [],
        build: m[5] ? m[5].split('.') : [],
        raw: String(version).trim(),
        version: s,
    }
}

export function compareSemver(a: string | SemverParts, b: string | SemverParts): number {
    const pa = typeof a === 'object' && a != null && 'major' in a ? a : parseSemver(String(a))
    const pb = typeof b === 'object' && b != null && 'major' in b ? b : parseSemver(String(b))
    if (!pa && !pb) return 0
    if (!pa) return -1
    if (!pb) return 1
    if (pa.major !== pb.major) return pa.major < pb.major ? -1 : 1
    if (pa.minor !== pb.minor) return pa.minor < pb.minor ? -1 : 1
    if (pa.patch !== pb.patch) return pa.patch < pb.patch ? -1 : 1
    const aPre = pa.prerelease || []
    const bPre = pb.prerelease || []
    if (aPre.length === 0 && bPre.length === 0) return 0
    if (aPre.length === 0) return 1
    if (bPre.length === 0) return -1
    const n = Math.max(aPre.length, bPre.length)
    for (let i = 0; i < n; i++) {
        if (i >= aPre.length) return -1
        if (i >= bPre.length) return 1
        const x = aPre[i]!
        const y = bPre[i]!
        const xNum = /^\d+$/.test(x)
        const yNum = /^\d+$/.test(y)
        if (xNum && yNum) {
            const xi = parseInt(x, 10)
            const yi = parseInt(y, 10)
            if (xi !== yi) return xi < yi ? -1 : 1
        } else if (xNum && !yNum) return -1
        else if (!xNum && yNum) return 1
        else if (x !== y) return x < y ? -1 : 1
    }
    return 0
}

export function sortSemvers(list: string[] | string, options?: { desc?: boolean }): string[] {
    let items: string[]
    if (!Array.isArray(list)) {
        items = String(list || '')
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean)
    } else {
        items = list.slice()
    }
    items.sort((a, b) => {
        const c = compareSemver(a, b)
        return options?.desc ? -c : c
    })
    return items
}

export function formatSemverCompare(a: string, b: string): string {
    const pa = parseSemver(a)
    const pb = parseSemver(b)
    if (!pa) throw new Error('版本 A 无效: ' + a)
    if (!pb) throw new Error('版本 B 无效: ' + b)
    const c = compareSemver(pa, pb)
    const rel = c < 0 ? '<' : c > 0 ? '>' : '='
    return [
        `A: ${pa.version}`,
        `B: ${pb.version}`,
        `比较: A ${rel} B`,
        `major/minor/patch: ${pa.major}.${pa.minor}.${pa.patch} vs ${pb.major}.${pb.minor}.${pb.patch}`,
        `prerelease: [${pa.prerelease.join('.')}] vs [${pb.prerelease.join('.')}]`,
    ].join('\n')
}

export type SemverBumpType = 'major' | 'minor' | 'patch'

export function bumpSemver(version: string, type: SemverBumpType): string {
    const p = parseSemver(version)
    if (!p) throw new Error('版本无效: ' + version)
    let major = p.major
    let minor = p.minor
    let patch = p.patch
    if (type === 'major') {
        major += 1
        minor = 0
        patch = 0
    } else if (type === 'minor') {
        minor += 1
        patch = 0
    } else {
        patch += 1
    }
    return `${major}.${minor}.${patch}`
}

/** 简单判断版本是否满足 ^x.y.z / ~x.y.z（不含复合 range） */
export function satisfiesRange(version: string, range: string): boolean {
    const v = parseSemver(version)
    if (!v) return false
    let r = String(range || '').trim()
    if (!r) return false
    if (r.charAt(0) === 'v' || r.charAt(0) === 'V') r = r.slice(1)
    const m = r.match(/^([\^~])?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/)
    if (!m) return false
    const op = m[1] || ''
    const major = parseInt(m[2]!, 10)
    const minor = parseInt(m[3]!, 10)
    const patch = parseInt(m[4]!, 10)
    const lower = `${major}.${minor}.${patch}`
    if (compareSemver(v, lower) < 0) return false
    if (!op) return compareSemver(v, lower) === 0
    if (op === '^') {
        if (major === 0) {
            if (minor === 0) return v.major === 0 && v.minor === 0 && v.patch === patch
            return v.major === 0 && v.minor === minor
        }
        return v.major === major
    }
    if (op === '~') {
        return v.major === major && v.minor === minor
    }
    return false
}

export function formatRangeCheck(version: string, range: string): string {
    const v = parseSemver(version)
    if (!v) throw new Error('版本无效: ' + version)
    const r = String(range || '').trim()
    if (!r) throw new Error('请输入 range（如 ^1.2.3 / ~1.2.3）')
    const ok = satisfiesRange(version, r)
    return [
        `版本: ${v.version}`,
        `Range: ${r}`,
        `满足: ${ok ? '是' : '否'}`,
        '',
        '说明: ^ 允许同 major 升级；~ 允许同 major.minor 的 patch 升级（0.x 按 npm 惯例收紧）',
    ].join('\n')
}