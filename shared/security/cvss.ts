/** CVSS 3.1 Base Score */

const WEIGHTS = {
    AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 } as Record<string, number>,
    AC: { L: 0.77, H: 0.44 } as Record<string, number>,
    PR: {
        U: { N: 0.85, L: 0.62, H: 0.27 },
        C: { N: 0.85, L: 0.68, H: 0.5 },
    } as Record<string, Record<string, number>>,
    UI: { N: 0.85, R: 0.62 } as Record<string, number>,
    C: { N: 0, L: 0.22, H: 0.56 } as Record<string, number>,
    I: { N: 0, L: 0.22, H: 0.56 } as Record<string, number>,
    A: { N: 0, L: 0.22, H: 0.56 } as Record<string, number>,
}

export const CVSS_OPTIONS = {
    AV: [
        { v: 'N', l: 'Network' },
        { v: 'A', l: 'Adjacent' },
        { v: 'L', l: 'Local' },
        { v: 'P', l: 'Physical' },
    ],
    AC: [
        { v: 'L', l: 'Low' },
        { v: 'H', l: 'High' },
    ],
    PR: [
        { v: 'N', l: 'None' },
        { v: 'L', l: 'Low' },
        { v: 'H', l: 'High' },
    ],
    UI: [
        { v: 'N', l: 'None' },
        { v: 'R', l: 'Required' },
    ],
    S: [
        { v: 'U', l: 'Unchanged' },
        { v: 'C', l: 'Changed' },
    ],
    C: [
        { v: 'N', l: 'None' },
        { v: 'L', l: 'Low' },
        { v: 'H', l: 'High' },
    ],
    I: [
        { v: 'N', l: 'None' },
        { v: 'L', l: 'Low' },
        { v: 'H', l: 'High' },
    ],
    A: [
        { v: 'N', l: 'None' },
        { v: 'L', l: 'Low' },
        { v: 'H', l: 'High' },
    ],
}

function cvssRoundUp1(num: number): number {
    const n = Math.round(num * 100000)
    if (n % 10000 === 0) return n / 100000
    return Math.ceil(num * 10) / 10
}

export function parseCvss31Vector(vector: string): Record<string, string> {
    const s = String(vector || '').trim()
    const metrics: Record<string, string> = {}
    for (const p of s.split('/')) {
        const m = p.match(/^([A-Z]+):([A-Z]+)$/i)
        if (m) metrics[m[1]!.toUpperCase()] = m[2]!.toUpperCase()
    }
    return metrics
}

export function cvss31Severity(score: number): string {
    if (score === 0) return 'None'
    if (score <= 3.9) return 'Low'
    if (score <= 6.9) return 'Medium'
    if (score <= 8.9) return 'High'
    return 'Critical'
}

export type CvssResult = {
    baseScore: number
    impact: number
    exploitability: number
    iss: number
    severity: string
    vector: string
    metrics: Record<string, string>
}

export function calcCvss31(metrics: Record<string, string> | string): CvssResult {
    let m: Record<string, string>
    if (typeof metrics === 'string') {
        m = parseCvss31Vector(metrics)
    } else {
        m = { ...metrics }
        for (const k of Object.keys(m)) m[k] = String(m[k]).toUpperCase()
    }
    const required = ['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A']
    for (const k of required) {
        if (!m[k]) throw new Error('缺少指标: ' + k)
    }
    if (!WEIGHTS.AV[m.AV!]) throw new Error('无效 AV: ' + m.AV)
    if (!WEIGHTS.AC[m.AC!]) throw new Error('无效 AC: ' + m.AC)
    if (!WEIGHTS.PR.U![m.PR!]) throw new Error('无效 PR: ' + m.PR)
    if (!WEIGHTS.UI[m.UI!]) throw new Error('无效 UI: ' + m.UI)
    if (m.S !== 'U' && m.S !== 'C') throw new Error('无效 S: ' + m.S)
    if (WEIGHTS.C[m.C!] === undefined) throw new Error('无效 C: ' + m.C)
    if (WEIGHTS.I[m.I!] === undefined) throw new Error('无效 I: ' + m.I)
    if (WEIGHTS.A[m.A!] === undefined) throw new Error('无效 A: ' + m.A)

    const av = WEIGHTS.AV[m.AV!]!
    const ac = WEIGHTS.AC[m.AC!]!
    const pr = WEIGHTS.PR[m.S!]![m.PR!]!
    const ui = WEIGHTS.UI[m.UI!]!
    const c = WEIGHTS.C[m.C!]!
    const iScore = WEIGHTS.I[m.I!]!
    const a = WEIGHTS.A[m.A!]!
    const iss = 1 - (1 - c) * (1 - iScore) * (1 - a)
    let impact: number
    if (m.S === 'U') impact = 6.42 * iss
    else impact = 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15)
    const exploitability = 8.22 * av * ac * pr * ui
    let baseScore: number
    if (impact <= 0) baseScore = 0
    else if (m.S === 'U') baseScore = cvssRoundUp1(Math.min(impact + exploitability, 10))
    else baseScore = cvssRoundUp1(Math.min(1.08 * (impact + exploitability), 10))

    const vector =
        'CVSS:3.1/AV:' +
        m.AV +
        '/AC:' +
        m.AC +
        '/PR:' +
        m.PR +
        '/UI:' +
        m.UI +
        '/S:' +
        m.S +
        '/C:' +
        m.C +
        '/I:' +
        m.I +
        '/A:' +
        m.A

    return {
        baseScore,
        impact: impact <= 0 ? 0 : cvssRoundUp1(impact),
        exploitability: cvssRoundUp1(exploitability),
        iss: Math.round(iss * 1000) / 1000,
        severity: cvss31Severity(baseScore),
        vector,
        metrics: m,
    }
}