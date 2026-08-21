/** Case 转换：camel / pascal / snake / kebab / upper / lower / constant */

export type CaseType = 'camel' | 'pascal' | 'snake' | 'kebab' | 'upper' | 'lower' | 'constant'

function splitWords(raw: string): string[] {
    const words = raw.match(/[a-zA-Z0-9]+/g)
    return words && words.length ? words : [raw]
}

const CONVERTERS: Record<CaseType, (words: string[]) => string> = {
    camel: (words) =>
        words
            .map((w, i) =>
                i === 0 ? w.toLowerCase() : w[0]!.toUpperCase() + w.slice(1).toLowerCase(),
            )
            .join(''),
    pascal: (words) => words.map((w) => w[0]!.toUpperCase() + w.slice(1).toLowerCase()).join(''),
    snake: (words) => words.map((w) => w.toLowerCase()).join('_'),
    kebab: (words) => words.map((w) => w.toLowerCase()).join('-'),
    upper: (words) => words.map((w) => w.toUpperCase()).join(' '),
    lower: (words) => words.map((w) => w.toLowerCase()).join(' '),
    constant: (words) => words.map((w) => w.toUpperCase()).join('_'),
}

export function convertCase(raw: string, type: CaseType): string {
    if (!raw) throw new Error('请输入文本')
    const converter = CONVERTERS[type]
    if (!converter) throw new Error('未知的转换类型')
    return converter(splitWords(raw))
}

export function convertCaseAll(raw: string): Record<CaseType, string> {
    const words = splitWords(raw || '')
    const out = {} as Record<CaseType, string>
    for (const k of Object.keys(CONVERTERS) as CaseType[]) {
        out[k] = raw ? CONVERTERS[k]!(words) : ''
    }
    return out
}
