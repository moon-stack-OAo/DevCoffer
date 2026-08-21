import fs from 'node:fs'
import path from 'node:path'

const cats = ['format', 'encode', 'security', 'generate', 'codegen', 'text', 'debug', 'reference']
const toolsSrc = fs.readFileSync('data/tools.ts', 'utf8')
const toolMeta = []
const re = /id:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?cat:\s*"([^"]+)"/g
let m
while ((m = re.exec(toolsSrc))) {
  toolMeta.push({ id: m[1], name: m[2], cat: m[3] })
}

function findVue(id) {
  for (const cat of cats) {
    const dir = path.join('components/tools', cat)
    if (!fs.existsSync(dir)) continue
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('Tool.vue')) continue
      const base = f.replace(/Tool\.vue$/, '').toLowerCase()
      if (base === id.toLowerCase() || id.toLowerCase().replace(/-/g, '') === base) {
        return path.join(dir, f)
      }
    }
  }
  // fuzzy: file contains id
  for (const cat of cats) {
    const dir = path.join('components/tools', cat)
    if (!fs.existsSync(dir)) continue
    for (const f of fs.readdirSync(dir)) {
      if (f.toLowerCase().includes(id.toLowerCase()) && f.endsWith('.vue')) return path.join(dir, f)
    }
  }
  return null
}

function analyze(file) {
  const t = fs.readFileSync(file, 'utf8')
  const issues = []
  const dualFalse = /:dual\s*=\s*["']false["']|:dual\s*=\s*false/.test(t)
  const hasInput = t.includes('#input')
  const hasOutput = t.includes('#output')
  const hasToolbar = t.includes('#toolbar')
  const actions = (t.match(/<template #actions>([\s\S]*?)<\/template>/) || [])[1] || ''
  const input = (t.match(/<template #input>([\s\S]*?)<\/template>/) || [])[1] || ''
  const output = (t.match(/<template #output>([\s\S]*?)<\/template>/) || [])[1] || ''

  if ((t.match(/<template\b/g) || []).length !== (t.match(/<\/template>/g) || []).length) {
    issues.push('broken-template')
  }
  if (!dualFalse && hasInput && hasOutput) {
    if (/<textarea\b/.test(input) && !/class="lbl"/.test(input)) issues.push('missing-left-lbl')
    if (/<textarea\b/.test(output) && !/class="lbl"/.test(output)) issues.push('missing-right-lbl')
    if (input.trim().length < 60 && !/<textarea|<div class="preview"|<div class="grid2"|<input\b/.test(input)) {
      issues.push('sparse-left')
    }
  }
  if (/<select[^>]*class="sel"/.test(actions)) issues.push('actions-wide-sel')
  if (/qrimg\{max-width:260px|\.swatch\{width:72px/.test(t)) issues.push('dead-css')
  if (!dualFalse && hasInput && /class="opts"/.test(input) && !hasToolbar) issues.push('opts-in-input')
  if (!dualFalse && hasInput && /class="hint"/.test(input) && !hasToolbar) issues.push('hint-in-input')
  if (/style="width:100%"/.test(actions)) issues.push('actions-fullwidth')
  return { dualFalse, hasToolbar, issues }
}

const byCat = {}
for (const cat of cats) byCat[cat] = { tools: [], issues: {} }

for (const tool of toolMeta) {
  if (!cats.includes(tool.cat)) continue
  const vue = findVue(tool.id)
  const entry = { id: tool.id, name: tool.name, vue, issues: [] }
  if (!vue) entry.issues.push('missing-vue')
  else {
    const a = analyze(vue)
    entry.issues = a.issues
    entry.dualFalse = a.dualFalse
    entry.hasToolbar = a.hasToolbar
  }
  byCat[tool.cat].tools.push(entry)
  for (const iss of entry.issues) {
    byCat[tool.cat].issues[iss] = (byCat[tool.cat].issues[iss] || 0) + 1
  }
}

const report = { byCat, totals: {} }
for (const cat of cats) {
  const tools = byCat[cat].tools
  const withIssues = tools.filter((t) => t.issues.length)
  report.totals[cat] = {
    count: tools.length,
    withIssues: withIssues.length,
    issues: byCat[cat].issues,
    problemIds: withIssues.map((t) => `${t.id}:${t.issues.join(',')}`),
  }
  console.log(`\n## ${cat} (${tools.length} tools, ${withIssues.length} with issues)`)
  console.log(JSON.stringify(byCat[cat].issues))
  for (const p of withIssues) console.log(`- ${p.id} => ${p.issues.join(', ')} (${p.vue || 'NO VUE'})`)
}

fs.writeFileSync('scripts/audit-by-category-report.json', JSON.stringify(report, null, 2))
console.log('\nDONE')
