import fs from 'node:fs'
import path from 'node:path'

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.name.endsWith('.vue')) out.push(p)
  }
  return out
}

const root = path.resolve('components/tools')
const files = walk(root)
let changed = 0
let skipped = 0

const leadRe =
  /^\s*(?:<div class="opts"[\s\S]*?<\/div>|<div class="grid2"[\s\S]*?<\/div>|<p class="hint"[\s\S]*?<\/p>|<div class="chips"[\s\S]*?<\/div>)\s*/

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  if (src.includes('#toolbar') || !src.includes('UiToolShell') || !src.includes('#input')) {
    skipped++
    continue
  }

  const inputRe = /<template #input>([\s\S]*?)<\/template>/
  const m = src.match(inputRe)
  if (!m) {
    skipped++
    continue
  }

  let rest = m[1]
  const leadParts = []
  for (let i = 0; i < 8; i++) {
    const mm = rest.match(leadRe)
    if (!mm) break
    leadParts.push(mm[0].trim())
    rest = rest.slice(mm[0].length)
  }

  if (!leadParts.length) {
    skipped++
    continue
  }

  if (!/(class="(lbl|ta|preview|inp)"|<textarea|<input|<img|<pre|<div)/.test(rest)) {
    skipped++
    continue
  }

  const toolbar = leadParts.join('\n      ')
  const trimmedRest = rest.replace(/^\n/, '').replace(/\s+$/, '')
  const toolbarBlock = `    <template #toolbar>\n      ${toolbar}\n    </template>\n`
  const newInputBlock = `    <template #input>\n${trimmedRest}\n    </template>`
  const newSrc = src.replace(inputRe, `${toolbarBlock}${newInputBlock}`)
  fs.writeFileSync(file, newSrc, 'utf8')
  changed++
  console.log('OK', path.relative(root, file))
}

console.log(`CHANGED=${changed} SKIPPED=${skipped}`)
