import { parseColor } from './color'

export function relativeLuminance(color: string): number {
    const { r, g, b } = parseColor(color)
    const rgb = [r, g, b].map((c) => {
        const v = c / 255
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!
}

function passLabel(ok: boolean) {
    return ok ? '通过' : '未通过'
}

export function contrastRatio(a: string, b: string) {
    const L1 = relativeLuminance(a)
    const L2 = relativeLuminance(b)
    const lighter = Math.max(L1, L2)
    const darker = Math.min(L1, L2)
    const ratio = (lighter + 0.05) / (darker + 0.05)
    const aa = ratio >= 4.5
    const aaa = ratio >= 7
    const aaLarge = ratio >= 3
    return {
        ratio: Math.round(ratio * 100) / 100,
        aa,
        aaa,
        aaLarge,
        summary: [
            '对比度: ' + (Math.round(ratio * 100) / 100),
            'AA(正文): ' + passLabel(aa),
            'AAA: ' + passLabel(aaa),
            'AA大字: ' + passLabel(aaLarge),
        ].join('\n'),
    }
}
