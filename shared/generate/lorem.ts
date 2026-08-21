/** Lorem / 中文占位文本 */

const EN_WORDS = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
    'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
    'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
    'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit',
    'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
    'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
    'mollit', 'anim', 'id', 'est', 'laborum', 'curabitur', 'pretium', 'tincidunt', 'lacus',
    'suspendisse', 'potenti', 'nullam', 'porta', 'diam', 'eu', 'urna', 'praesent', 'elementum',
    'facilisis', 'leo', 'vel', 'fringilla', 'ullamcorper', 'eget', 'facilisi', 'etiam',
    'dignissim', 'lobortis', 'scelerisque', 'fermentum', 'dui', 'faucibus', 'ornare', 'quam',
    'viverra', 'orci', 'sagittis', 'volutpat', 'odio', 'mauris', 'massa', 'vitae', 'tortor',
    'condimentum', 'lacinia', 'eros', 'donec', 'ac', 'tempor', 'dapibus', 'ultrices', 'iaculis',
    'nunc', 'augue',
]

const ZH_SENTENCES = [
    '这是一段用于界面布局调试的中文占位文本。',
    '在真实内容尚未就绪时，可用假文快速验证排版效果。',
    '段落长度应尽量接近真实业务文案，以便评估换行与留白。',
    '前端开发中常需要中英文混排场景，以检查字体与行高。',
    '请根据实际页面宽度调整段落数量与每段句数。',
    '占位文字不应包含敏感信息，仅用于视觉与交互验证。',
    '合理的假文能帮助产品与设计更快对齐信息层级。',
    '如果需要更长内容，可增加段落数或每段句子数。',
    '中文假文通常以完整句子为单位，读起来更自然。',
    '开发者工具箱中的 Lorem 生成器可一键复制输出。',
    '注意在窄屏设备上检查文字截断与溢出表现。',
    '标题、正文与说明文字可使用不同长度的占位内容。',
    '列表、卡片与表格单元格也适合使用短句假文。',
    '生成结果可直接粘贴到原型或静态页面中预览。',
    '保持语句通顺有助于评审时不被乱码分散注意力。',
]

function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
    return arr[randInt(0, arr.length - 1)]!
}

function enSentence(wordCount?: number): string {
    const n = wordCount != null && isFinite(wordCount) ? Math.max(3, Math.floor(wordCount)) : randInt(6, 14)
    const words: string[] = []
    for (let i = 0; i < n; i++) words.push(pick(EN_WORDS))
    words[0] = words[0]!.charAt(0).toUpperCase() + words[0]!.slice(1)
    return words.join(' ') + '.'
}

export function loremGenerate(opts?: {
    lang?: 'en' | 'zh'
    paragraphs?: number
    sentences?: number
    wordsPerSentence?: number
}): string {
    const o = opts || {}
    const lang = String(o.lang || 'en').toLowerCase() === 'zh' ? 'zh' : 'en'
    let paragraphs = o.paragraphs != null ? Math.floor(Number(o.paragraphs)) : 3
    let sentences = o.sentences != null ? Math.floor(Number(o.sentences)) : 4
    paragraphs = Math.max(1, Math.min(50, paragraphs))
    sentences = Math.max(1, Math.min(40, sentences))
    const paras: string[] = []
    for (let p = 0; p < paragraphs; p++) {
        const sents: string[] = []
        for (let s = 0; s < sentences; s++) {
            sents.push(lang === 'zh' ? pick(ZH_SENTENCES) : enSentence(o.wordsPerSentence))
        }
        paras.push(sents.join(lang === 'zh' ? '' : ' '))
    }
    return paras.join('\n\n')
}

export function loremParseHexColor(color: string | null | undefined): string | null {
    if (color == null) return null
    const s = String(color).trim()
    if (!s) return null
    if (s[0] === '#') {
        let hex = s.slice(1)
        if (hex.length === 3) {
            hex = hex
                .split('')
                .map((c) => c + c)
                .join('')
        }
        if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null
        return '#' + hex.toLowerCase()
    }
    const m = s.match(/^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/i)
    if (m) {
        const r = Math.max(0, Math.min(255, Math.round(Number(m[1]))))
        const g = Math.max(0, Math.min(255, Math.round(Number(m[2]))))
        const b = Math.max(0, Math.min(255, Math.round(Number(m[3]))))
        const h = (n: number) => ('0' + n.toString(16)).slice(-2)
        return '#' + h(r) + h(g) + h(b)
    }
    return null
}

export function loremPlaceholderDataUrl(opts?: {
    width?: number
    height?: number
    bg?: string
    fg?: string
    text?: string
    canvas?: HTMLCanvasElement
}): { ok: true; dataUrl: string } | { ok: false; msg: string } {
    const o = opts || {}
    let w = Math.floor(Number(o.width))
    let h = Math.floor(Number(o.height))
    if (!isFinite(w) || w < 1 || !isFinite(h) || h < 1) {
        return { ok: false, msg: '宽高必须为正整数' }
    }
    w = Math.min(4000, w)
    h = Math.min(4000, h)

    const bg = loremParseHexColor(o.bg) || '#cccccc'
    const fg = loremParseHexColor(o.fg) || '#333333'
    const text = o.text != null ? String(o.text) : w + '×' + h

    let canvas = o.canvas || null
    if (!canvas) {
        if (typeof document === 'undefined' || !document.createElement) {
            return { ok: false, msg: '当前环境不支持 Canvas' }
        }
        canvas = document.createElement('canvas')
    }
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext && canvas.getContext('2d')
    if (!ctx) {
        return { ok: false, msg: '当前环境不支持 Canvas' }
    }

    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    if (text) {
        const fontSize = Math.max(10, Math.min(w, h) / 8)
        ctx.fillStyle = fg
        ctx.font = 'bold ' + fontSize + 'px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, w / 2, h / 2, w * 0.9)
    }

    try {
        return { ok: true, dataUrl: canvas.toDataURL('image/png') }
    } catch (e) {
        return { ok: false, msg: '生成失败：' + (e instanceof Error ? e.message : String(e)) }
    }
}