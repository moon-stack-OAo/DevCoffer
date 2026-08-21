import { readFileSync } from 'node:fs'
const j = JSON.parse(readFileSync('node_modules/bootstrap-icons/font/bootstrap-icons.json', 'utf8'))
const css = readFileSync('node_modules/bootstrap-icons/font/bootstrap-icons.css', 'utf8')
for (const name of ['braces', 'box-seam', 'star', 'search', 'tools']) {
    const re = new RegExp(String.raw`\.bi-${name}::before\s*\{\s*content:\s*"\\([^"]+)"`)
    const m = css.match(re)
    console.log(name, 'official=', m && m[1], 'json=', Number(j[name]).toString(16))
}
