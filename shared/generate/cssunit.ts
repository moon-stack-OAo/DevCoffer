const ROOT = 16

export function cssUnitConvert(value: number, from: string, rootPx = ROOT) {
    const px = toPx(value, from, rootPx)
    return {
        px: round(px),
        rem: round(px / rootPx),
        em: round(px / rootPx),
        pt: round(px * 0.75),
        pc: round(px * 0.0625),
        in: round(px / 96),
        cm: round(px / 37.795),
        mm: round(px / 3.7795),
        '%': round((px / rootPx) * 100),
    }
}

function toPx(v: number, u: string, root: number) {
    switch (u) {
        case 'px':
            return v
        case 'rem':
        case 'em':
            return v * root
        case 'pt':
            return v / 0.75
        case 'pc':
            return v / 0.0625
        case 'in':
            return v * 96
        case 'cm':
            return v * 37.795
        case 'mm':
            return v * 3.7795
        case '%':
            return (v / 100) * root
        default:
            throw new Error('未知单位')
    }
}

function round(n: number) {
    return Math.round(n * 10000) / 10000
}
