/** 站点 SEO / 绝对 URL 配置 */
export const SITE = {
    name: 'DevCoffer',
    brand: 'DevCoffer · 码柜',
    /** 生产站点根，勿带尾斜杠 */
    url: 'https://tools.livancen.top',
    locale: 'zh_CN',
    lang: 'zh-CN',
    themeColor: '#0b1220',
    twitter: '',
    defaultDescription:
        'DevCoffer（码柜）—— 免费纯前端开发者工具箱：JSON/YAML/SQL 格式化、编解码、哈希加密、UUID、代码生成等，本地处理，数据不出浏览器。',
    keywords: [
        '在线工具',
        '开发者工具',
        'JSON 格式化',
        'Base64',
        'UUID',
        '哈希',
        '编解码',
        'YAML',
        'SQL',
        '纯前端',
        'DevCoffer',
        '码柜',
    ],
} as const

export function absUrl(path = '/'): string {
    const base = SITE.url.replace(/\/$/, '')
    if (!path || path === '/') return `${base}/`
    return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function clipMeta(text: string, max = 160): string {
    const t = (text || '').replace(/\s+/g, ' ').trim()
    if (t.length <= max) return t
    return `${t.slice(0, max - 1)}…`
}
