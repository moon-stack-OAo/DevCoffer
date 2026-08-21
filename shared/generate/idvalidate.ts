/** 中国居民身份证校验 */

const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
const CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

const PROVINCES: Record<string, string> = {
    11: '北京', 12: '天津', 13: '河北', 14: '山西', 15: '内蒙古',
    21: '辽宁', 22: '吉林', 23: '黑龙江',
    31: '上海', 32: '江苏', 33: '浙江', 34: '安徽', 35: '福建', 36: '江西', 37: '山东',
    41: '河南', 42: '湖北', 43: '湖南', 44: '广东', 45: '广西', 46: '海南',
    50: '重庆', 51: '四川', 52: '贵州', 53: '云南', 54: '西藏',
    61: '陕西', 62: '甘肃', 63: '青海', 64: '宁夏', 65: '新疆',
    71: '台湾', 81: '香港', 82: '澳门',
}

export function idvCalcCheckCode(body17: string): string {
    let sum = 0
    for (let i = 0; i < 17; i++) sum += parseInt(body17.charAt(i), 10) * WEIGHTS[i]!
    return CHECK_CODES[sum % 11]!
}

export type IdValidateResult = {
    ok: boolean
    valid: boolean
    info?: {
        length: number
        region: string
        regionCode: string
        birth: string
        gender: string
        checkCode?: string
        actualCheckCode?: string
        note?: string
    }
    msg: string
}

export function idValidateIdCard(id: string): IdValidateResult {
    if (id == null || String(id).trim() === '') {
        return { ok: false, valid: false, msg: '请输入身份证号' }
    }
    const s = String(id).trim().toUpperCase()
    if (/^\d{15}$/.test(s)) {
        const y15 = '19' + s.slice(6, 8)
        const m15 = s.slice(8, 10)
        const d15 = s.slice(10, 12)
        const birth15 = y15 + '-' + m15 + '-' + d15
        const seq15 = parseInt(s.charAt(14), 10)
        return {
            ok: true,
            valid: true,
            info: {
                length: 15,
                region: PROVINCES[s.slice(0, 2)] || '未知',
                regionCode: s.slice(0, 6),
                birth: birth15,
                gender: seq15 % 2 === 1 ? '男' : '女',
                note: '15 位旧证无校验位，仅做格式与日期粗检',
            },
            msg: '15 位旧证格式可接受（无校验位）',
        }
    }
    if (!/^\d{17}[\dX]$/.test(s)) {
        return { ok: true, valid: false, msg: '须为 18 位（末位可为 X）或 15 位数字' }
    }
    const body = s.slice(0, 17)
    const expected = idvCalcCheckCode(body)
    const actual = s.charAt(17)
    const checkOk = expected === actual
    const regionCode = s.slice(0, 6)
    const province = PROVINCES[s.slice(0, 2)] || '未知'
    const birthRaw = s.slice(6, 14)
    const by = parseInt(birthRaw.slice(0, 4), 10)
    const bm = parseInt(birthRaw.slice(4, 6), 10)
    const bd = parseInt(birthRaw.slice(6, 8), 10)
    const birth =
        birthRaw.slice(0, 4) + '-' + birthRaw.slice(4, 6) + '-' + birthRaw.slice(6, 8)
    let dateOk = true
    if (bm < 1 || bm > 12 || bd < 1 || bd > 31 || by < 1900 || by > 2100) {
        dateOk = false
    } else {
        const dt = new Date(by, bm - 1, bd)
        if (dt.getFullYear() !== by || dt.getMonth() !== bm - 1 || dt.getDate() !== bd) dateOk = false
    }
    const seq = parseInt(s.charAt(16), 10)
    const gender = seq % 2 === 1 ? '男' : '女'
    const valid = checkOk && dateOk
    let msg: string
    if (!dateOk) msg = '出生日期无效: ' + birth
    else if (!checkOk) msg = '校验位错误，期望 ' + expected + '，实际 ' + actual
    else msg = '校验通过'
    return {
        ok: true,
        valid,
        info: {
            length: 18,
            region: province,
            regionCode,
            birth,
            gender,
            checkCode: expected,
            actualCheckCode: actual,
        },
        msg,
    }
}

export function formatIdValidate(id: string): string {
    const r = idValidateIdCard(id)
    if (!r.ok) throw new Error(r.msg)
    const lines = [`结果: ${r.valid ? '有效' : '无效'}`, `说明: ${r.msg}`]
    if (r.info) {
        lines.push(
            `长度: ${r.info.length}`,
            `地区: ${r.info.region} (${r.info.regionCode})`,
            `出生: ${r.info.birth}`,
            `性别: ${r.info.gender}`,
        )
        if (r.info.checkCode) lines.push(`校验位期望: ${r.info.checkCode}`)
        if (r.info.note) lines.push(r.info.note)
    }
    return lines.join('\n')
}