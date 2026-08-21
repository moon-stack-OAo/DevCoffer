/**
 * 根据 data/tools.ts 生成 public/sitemap.xml
 * 用法：npm run sitemap
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const SITE = 'https://tools.livancen.top'
const today = new Date().toISOString().slice(0, 10)

function parseTools(src) {
    const start = src.indexOf('export const tools')
    if (start < 0) throw new Error('未找到 export const tools')
    const slice = src.slice(start)
    const end = slice.search(/\nexport const /)
    const block = end > 0 ? slice.slice(0, end) : slice
    const tools = []
    const re =
        /\{\s*id:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]*)"[\s\S]*?desc:\s*"([^"]*)"[\s\S]*?cat:\s*"([^"]+)"/g
    let m
    while ((m = re.exec(block))) {
        tools.push({ id: m[1], name: m[2], cat: m[4] })
    }
    if (tools.length < 50) {
        const ids = [...new Set([...block.matchAll(/id:\s*"([^"]+)"/g)].map((x) => x[1]))]
        return ids.map((id) => ({ id, name: id, cat: '' }))
    }
    return tools
}

function parseCategories(src) {
    const start = src.indexOf('export const categories')
    if (start < 0) return []
    const slice = src.slice(start)
    const end = slice.search(/\nexport const tools/)
    const block = end > 0 ? slice.slice(0, end) : slice
    const cats = []
    const re = /\{\s*id:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]*)"[\s\S]*?virtual:\s*(true|false)/g
    let m
    while ((m = re.exec(block))) {
        if (m[3] === 'false') cats.push({ id: m[1], name: m[2] })
    }
    return cats
}

function urlEntry(path, priority, changefreq = 'weekly') {
    const loc = path === '/' ? `${SITE}/` : `${SITE}${path}`
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

const src = readFileSync(join(root, 'data', 'tools.ts'), 'utf-8')
const tools = parseTools(src)
const cats = parseCategories(src)
const seen = new Set()

const parts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntry('/', '1.0', 'daily'),
]

for (const c of cats) {
    if (seen.has(`c:${c.id}`)) continue
    seen.add(`c:${c.id}`)
    parts.push(urlEntry(`/c/${c.id}`, '0.8'))
}

for (const t of tools) {
    if (seen.has(`t:${t.id}`)) continue
    seen.add(`t:${t.id}`)
    parts.push(urlEntry(`/t/${t.id}`, '0.7'))
}

parts.push('</urlset>', '')
writeFileSync(join(root, 'public', 'sitemap.xml'), parts.join('\n'), 'utf-8')
console.log(
    `[sitemap] wrote public/sitemap.xml · home=1 cats=${cats.length} tools=${tools.length}`,
)
