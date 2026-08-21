/** 人民币金额 → 中文大写 */

const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
const INT_UNITS = ['', '拾', '佰', '仟']
const SEC_UNITS = ['', '万', '亿', '兆']

function sectionToChinese(sec: string): string {
    const padded = sec.padStart(4, '0')
    if (padded === '0000') return ''
    let text = ''
    let zeroFlag = false
    for (let i = 0; i < 4; i++) {
        const d = parseInt(padded[i]!, 10)
        const unit = INT_UNITS[3 - i]!
        if (d === 0) {
            zeroFlag = true
        } else {
            if (zeroFlag && text) text += '零'
            zeroFlag = false
            text += DIGITS[d]! + unit
        }
    }
    return text
}

function intToChinese(intStr: string): string {
    const sections: string[] = []
    let s = intStr
    while (s.length > 0) {
        sections.unshift(s.slice(-4))
        s = s.slice(0, -4)
    }
    let out = ''
    let zeroPending = false
    sections.forEach((sec, idx) => {
        const secIdx = sections.length - 1 - idx
        const secText = sectionToChinese(sec)
        if (!secText) {
            if (out) zeroPending = true
            return
        }
        if (zeroPending && out) {
            out += '零'
            zeroPending = false
        }
        out += secText + SEC_UNITS[secIdx]!
    })
    return out || '零'
}

export function numberToChineseYuan(input: string | number): string {
    if (input === null || input === undefined || String(input).trim() === '') {
        throw new Error('请输入金额')
    }
    let s = String(input).trim().replace(/,/g, '').replace(/￥|¥|元/g, '')
    if (s.startsWith('+')) s = s.slice(1)
    let negative = false
    if (s.startsWith('-')) {
        negative = true
        s = s.slice(1)
    }
    if (!/^\d+(\.\d+)?$/.test(s)) throw new Error('金额格式无效')
    const parts = s.split('.')
    let intPart = parts[0]!.replace(/^0+/, '') || '0'
    let decPart = (parts[1] || '').slice(0, 2)
    while (decPart.length < 2) decPart += '0'
    if (intPart.length > 16) throw new Error('金额过大，超过支持范围')
    const jiao = parseInt(decPart[0]!, 10)
    const fen = parseInt(decPart[1]!, 10)
    let result = ''
    if (intPart === '0') result = '零圆'
    else result = intToChinese(intPart) + '圆'
    if (jiao === 0 && fen === 0) {
        result += '整'
    } else {
        if (jiao > 0) result += DIGITS[jiao]! + '角'
        else if (fen > 0 && intPart !== '0') result += '零'
        if (fen > 0) result += DIGITS[fen]! + '分'
    }
    return (negative ? '负' : '') + result
}