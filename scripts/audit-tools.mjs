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
const report = {
  brokenTemplate: [],
  unbalancedToolbarDiv: [],
  dualEmptyLeft: [],
  dualMissingLeftLbl: [],
  dualMissingRightLbl: [],
  actionsWideSel: [],
  deadScopedCss: [],
  dualOnlyHintLeft: [],
  dualNoInputLblWithTa: [],
}

for (const file of files) {
  const rel = path.relative(process.cwd(), file)
  const t = fs.readFileSync(file, 'utf8')
  const openT = (t.match(/<template\b/g) || []).length
  const closeT = (t.match(/<\/template>/g) || []).length
  if (openT !== closeT) report.brokenTemplate.push(rel)

  // Extract #toolbar while allowing nested <template v-if>…</template>
  const tbStart = t.indexOf('<template #toolbar>')
  if (tbStart >= 0) {
    let i = tbStart + '<template #toolbar>'.length
    let depth = 1
    while (i < t.length && depth > 0) {
      const nextOpen = t.indexOf('<template', i)
      const nextClose = t.indexOf('</template>', i)
      if (nextClose < 0) break
      if (nextOpen >= 0 && nextOpen < nextClose) {
        depth++
        i = nextOpen + 9
      } else {
        depth--
        if (depth === 0) {
          const tb = t.slice(tbStart + '<template #toolbar>'.length, nextClose)
          const openDiv = (tb.match(/<div\b/g) || []).length
          const closeDiv = (tb.match(/<\/div>/g) || []).length
          if (openDiv !== closeDiv) report.unbalancedToolbarDiv.push(rel)
          break
        }
        i = nextClose + 11
      }
    }
  }

  const dualFalse = /:dual\s*=\s*["']false["']|:dual\s*=\s*false/.test(t)
  const hasInput = t.includes('#input')
  const hasOutput = t.includes('#output')

  if (!dualFalse && hasInput && hasOutput) {
    const inputMatch = t.match(/<template #input>([\s\S]*?)<\/template>/)
    const outputMatch = t.match(/<template #output>([\s\S]*?)<\/template>/)
    const input = inputMatch?.[1] || ''
    const output = outputMatch?.[1] || ''

    const inputHasTa = /<textarea\b/.test(input) || /class="ta"/.test(input)
    const inputHasLbl = /class="lbl"/.test(input)
    const outputHasLbl = /class="lbl"/.test(output)
    const inputOnlyHint = /^\s*<p class="hint"[\s\S]*?<\/p>\s*$/.test(input)
    const inputSparse = input.trim().length < 80 && !inputHasTa && !/<div class="preview"/.test(input) && !/<div class="grid2"/.test(input)

    if (inputOnlyHint || inputSparse) report.dualEmptyLeft.push(rel)
    if (inputHasTa && !inputHasLbl) report.dualMissingLeftLbl.push(rel)
    if (/<textarea\b/.test(output) && !outputHasLbl) report.dualMissingRightLbl.push(rel)
    if (inputOnlyHint) report.dualOnlyHintLeft.push(rel)
    if (inputHasTa && !inputHasLbl) report.dualNoInputLblWithTa.push(rel)
  }

  const actionsMatch = t.match(/<template #actions>([\s\S]*?)<\/template>/)
  if (actionsMatch && /<select[^>]*class="sel"/.test(actionsMatch[1])) {
    report.actionsWideSel.push(rel)
  }

  if (/qrimg\{max-width:260px/.test(t) || /\.swatch\{width:72px/.test(t)) {
    report.deadScopedCss.push(rel)
  }
}

for (const [k, v] of Object.entries(report)) {
  console.log(`\n## ${k} (${v.length})`)
  for (const f of v.slice(0, 80)) console.log('- ' + f)
  if (v.length > 80) console.log(`... +${v.length - 80} more`)
}

const summary = Object.fromEntries(Object.entries(report).map(([k, v]) => [k, v.length]))
console.log('\nSUMMARY ' + JSON.stringify(summary))
fs.writeFileSync('scripts/audit-tools-report.json', JSON.stringify(report, null, 2))
