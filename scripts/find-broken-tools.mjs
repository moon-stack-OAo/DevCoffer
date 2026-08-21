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
const bad = []

for (const file of files) {
  const t = fs.readFileSync(file, 'utf8')
  const issues = []
  const openT = (t.match(/<template\b/g) || []).length
  const closeT = (t.match(/<\/template>/g) || []).length
  if (openT !== closeT) issues.push(`template ${openT}/${closeT}`)

  // grid2 opened in toolbar and NOT closed before toolbar ends
  const toolbarMatch = t.match(/<template #toolbar>([\s\S]*?)<\/template>/)
  if (toolbarMatch) {
    const tb = toolbarMatch[1]
    const openGrid = (tb.match(/<div class="grid2">/g) || []).length
    const closeDiv = (tb.match(/<\/div>/g) || []).length
    // crude: if grid2 opened more than can be closed in toolbar alone when also counting nested
    if (openGrid > 0) {
      const openDiv = (tb.match(/<div\b/g) || []).length
      if (openDiv !== closeDiv) issues.push('unbalanced-toolbar-div')
    }
  }

  if (/placeholder="[^"]*\n/.test(t)) issues.push('broken-placeholder')

  if (issues.length) {
    bad.push(`${path.relative(process.cwd(), file)} => ${issues.join(', ')}`)
  }
}

console.log(bad.join('\n') || 'NONE')
console.log('BADCOUNT=' + bad.length)
