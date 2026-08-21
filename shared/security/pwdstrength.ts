/** 密码强度评估（本地纯函数） */

const LEVELS = [
    { key: 'empty', label: '未输入', min: -1 },
    { key: 'weak', label: '弱', min: 0 },
    { key: 'medium', label: '中', min: 40 },
    { key: 'strong', label: '强', min: 60 },
    { key: 'very-strong', label: '很强', min: 80 },
]

const COMMON_WEAK = [
    'password', 'password1', 'password123', '123456', '12345678', '123456789', '1234567890',
    'qwerty', 'qwertyuiop', 'abc123', 'abcd1234', 'admin', 'admin123', 'root', 'letmein',
    'welcome', 'iloveyou', 'monkey', 'dragon', 'master', 'login', 'passw0rd', 'p@ssw0rd',
    'p@ssword', '111111', '000000', '666666', '888888', '654321', '1qaz2wsx', 'qazwsx',
    'asdfgh', 'zxcvbn', 'sunshine', 'princess', 'football', 'baseball', 'shadow', 'michael',
    'jennifer', 'superman', 'batman', 'trustno1', 'hello', 'charlie', 'aa123456', 'password!',
    'pass123', 'test', 'test123', 'guest', 'user', 'default', 'changeme',
]

const SEQ_PATTERNS = [
    'abcdefghijklmnopqrstuvwxyz', 'zyxwvutsrqponmlkjihgfedcba', '0123456789', '9876543210',
    'qwertyuiop', 'poiuytrewq', 'asdfghjkl', 'lkjhgfdsa', 'zxcvbnm', 'mnbvcxz',
]

function hasUpper(s: string) {
    return /[A-Z]/.test(s)
}
function hasLower(s: string) {
    return /[a-z]/.test(s)
}
function hasDigit(s: string) {
    return /[0-9]/.test(s)
}
function hasSpecial(s: string) {
    return /[^A-Za-z0-9]/.test(s)
}

function isCommonWeak(s: string) {
    const lower = String(s).toLowerCase()
    if (COMMON_WEAK.includes(lower)) return true
    for (const w of COMMON_WEAK) {
        if (w.length >= 4 && lower.includes(w)) return true
    }
    return false
}

function hasSequential(s: string) {
    const lower = String(s).toLowerCase()
    if (lower.length < 3) return false
    for (const seq of SEQ_PATTERNS) {
        for (let i = 0; i <= seq.length - 3; i++) {
            if (lower.includes(seq.slice(i, i + 3))) return true
        }
    }
    for (let i = 0; i < lower.length - 2; i++) {
        const a = lower.charCodeAt(i)
        const b = lower.charCodeAt(i + 1)
        const c = lower.charCodeAt(i + 2)
        if (b - a === 1 && c - b === 1) return true
        if (a - b === 1 && b - c === 1) return true
    }
    return false
}

function hasRepeated(s: string) {
    return /(.)\1{2,}/.test(String(s))
}

function scoreToLevel(score: number) {
    if (score < 0) return LEVELS[0]!
    let level = LEVELS[1]!
    for (let i = 1; i < LEVELS.length; i++) {
        if (score >= LEVELS[i]!.min) level = LEVELS[i]!
    }
    return level
}

export type PwdCheck = { id: string; label: string; pass: boolean; weight: number }

export type PwdStrengthResult = {
    score: number
    level: string
    label: string
    checks: PwdCheck[]
    suggestions: string[]
    length: number
}

export function evaluatePasswordStrength(password: string): PwdStrengthResult {
    const pwd = password == null ? '' : String(password)
    const len = pwd.length
    if (!len) {
        return {
            score: 0,
            level: 'empty',
            label: '未输入',
            checks: [],
            suggestions: ['请输入待检测的密码'],
            length: 0,
        }
    }

    const checks: PwdCheck[] = [
        { id: 'len8', label: '长度 ≥ 8', pass: len >= 8, weight: 15 },
        { id: 'len12', label: '长度 ≥ 12', pass: len >= 12, weight: 10 },
        { id: 'len16', label: '长度 ≥ 16', pass: len >= 16, weight: 10 },
        { id: 'upper', label: '包含大写字母', pass: hasUpper(pwd), weight: 12 },
        { id: 'lower', label: '包含小写字母', pass: hasLower(pwd), weight: 12 },
        { id: 'digit', label: '包含数字', pass: hasDigit(pwd), weight: 12 },
        { id: 'special', label: '包含特殊字符', pass: hasSpecial(pwd), weight: 14 },
        { id: 'not-common', label: '非常见弱密码', pass: !isCommonWeak(pwd), weight: 15 },
        { id: 'no-seq', label: '无连续字符序列', pass: !hasSequential(pwd), weight: 10 },
        { id: 'no-repeat', label: '无连续重复字符', pass: !hasRepeated(pwd), weight: 10 },
    ]

    let score = 0
    for (const c of checks) if (c.pass) score += c.weight
    if (len >= 20) score += 5
    else if (len >= 18) score += 3
    if (isCommonWeak(pwd)) score = Math.min(score, 25)
    if (len < 6) score = Math.min(score, 20)
    score = Math.max(0, Math.min(100, score))
    const levelInfo = scoreToLevel(score)

    const suggestions: string[] = []
    if (len < 8) suggestions.push('将密码加长到至少 8 位')
    else if (len < 12) suggestions.push('建议长度至少 12 位以提升安全性')
    else if (len < 16) suggestions.push('可进一步加长到 16 位以上')
    if (!hasUpper(pwd)) suggestions.push('加入大写字母（A-Z）')
    if (!hasLower(pwd)) suggestions.push('加入小写字母（a-z）')
    if (!hasDigit(pwd)) suggestions.push('加入数字（0-9）')
    if (!hasSpecial(pwd)) suggestions.push('加入特殊字符（如 !@#$%^&*）')
    if (isCommonWeak(pwd)) suggestions.push('避免使用常见弱密码或字典词')
    if (hasSequential(pwd)) suggestions.push('避免连续序列（如 abc、123、qwe）')
    if (hasRepeated(pwd)) suggestions.push('避免连续重复字符（如 aaa、111）')
    if (!suggestions.length) suggestions.push('强度良好，请妥善保管，勿在多处复用')

    return {
        score,
        level: levelInfo.key,
        label: levelInfo.label,
        checks,
        suggestions,
        length: len,
    }
}