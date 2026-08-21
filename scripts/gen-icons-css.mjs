/**
 * 将 bootstrap-icons 的 SVG 拷到 public/icons，供 <UiToolIcon> 使用
 */
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'node_modules/bootstrap-icons/icons')
const outDir = join(root, 'public/icons')
mkdirSync(outDir, { recursive: true })

let n = 0
for (const file of readdirSync(srcDir)) {
    if (!file.endsWith('.svg')) continue
    let svg = readFileSync(join(srcDir, file), 'utf8')
    svg = svg
        .replace(/\swidth="16"/g, '')
        .replace(/\sheight="16"/g, '')
        .replace(/fill="currentColor"/g, 'fill="currentColor"')
    writeFileSync(join(outDir, file), svg, 'utf8')
    n++
}

// 兼容旧链路：仍生成精简 font css（可选，不再默认引用）
const fontDir = join(root, 'node_modules/bootstrap-icons/font')
const outFontDir = join(root, 'public/fonts')
mkdirSync(outFontDir, { recursive: true })
try {
    copyFileSync(join(fontDir, 'fonts/bootstrap-icons.woff2'), join(outFontDir, 'bootstrap-icons.woff2'))
    copyFileSync(join(fontDir, 'fonts/bootstrap-icons.woff'), join(outFontDir, 'bootstrap-icons.woff'))
} catch {
    /* ignore */
}

console.log(`[icons] copied ${n} SVGs -> public/icons/`)
