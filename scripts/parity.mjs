/**
 * 对等验收：根据 tools + parity-status + parity-cases
 * 生成 docs/parity-checklist.md，并刷新 docs/acceptance-matrix.md 状态列。
 *
 * 用法：npm run parity
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const VALID = new Set(['migrated', 'verified', 'waived', 'pending'])

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
        tools.push({ id: m[1], name: m[2], desc: m[3], cat: m[4] })
    }
    if (tools.length < 50) {
        const ids = [...block.matchAll(/id:\s*"([^"]+)"/g)].map((x) => x[1])
        return [...new Set(ids)].map((id) => {
            const hit = tools.find((t) => t.id === id)
            return hit || { id, name: id, desc: '', cat: '' }
        })
    }
    return tools
}

function parseVueIds(implSrc) {
    const ids = new Set()
    // 兼容 base64: { kind: 'vue' } 与 "image-compress": { kind: 'vue' }
    const re = /^\s*["']?([a-z0-9-]+)["']?\s*:\s*\{\s*kind:\s*'vue'/gm
    let m
    while ((m = re.exec(implSrc))) ids.add(m[1])
    return ids
}

function defaultCases(t) {
    return [
        `主路径：对照旧站完成 1 次典型操作（${t.name || t.id}）`,
        '空输入 / 清空后行为',
        '非法或不完整输入（若适用）→ 有明确错误提示',
    ]
}

function esc(s) {
    return String(s || '')
        .replace(/\|/g, '\\|')
        .replace(/\n/g, ' ')
}

const tools = parseTools(readFileSync(join(root, 'data', 'tools.ts'), 'utf-8'))
const vueIds = parseVueIds(readFileSync(join(root, 'data', 'tool-impl.ts'), 'utf-8'))

const statusPath = join(root, 'data', 'parity-status.json')
const casesPath = join(root, 'data', 'parity-cases.json')
const statusMap = existsSync(statusPath)
    ? JSON.parse(readFileSync(statusPath, 'utf-8'))
    : {}
const casesMap = existsSync(casesPath)
    ? JSON.parse(readFileSync(casesPath, 'utf-8'))
    : {}

function resolveStatus(id) {
    const entry = statusMap[id]
    if (entry && VALID.has(entry.status)) return entry
    if (vueIds.has(id)) return { status: 'migrated', note: '待旧站对照' }
    return { status: 'pending', note: '无 Vue 实现' }
}

const counts = { migrated: 0, verified: 0, waived: 0, pending: 0 }

for (const t of tools) {
    const st = resolveStatus(t.id).status
    counts[st] = (counts[st] || 0) + 1
}

const today = new Date().toISOString().slice(0, 10)

// —— parity-checklist.md ——
const checklist = [
    '# 对等验收清单',
    '',
    `> 生成时间：${today}  `,
    `> 工具总数：**${tools.length}**  `,
    `> verified: **${counts.verified}** · migrated: **${counts.migrated}** · waived: **${counts.waived}** · pending: **${counts.pending}**  `,
    `> 流程说明：[parity-verification.md](./parity-verification.md)`,
    '',
    '在 `data/parity-status.json` 填写结果后执行 `npm run parity` 刷新本表与验收矩阵。',
    '',
    '| id | name | cat | 状态 | 建议用例 | 备注 |',
    '|----|------|-----|------|----------|------|',
]

for (const t of tools) {
    const st = resolveStatus(t.id)
    const custom = casesMap[t.id]?.cases
    const cases = (custom && custom.length ? custom : defaultCases(t))
        .map((c, i) => `${i + 1}. ${c}`)
        .join('<br>')
    checklist.push(
        `| ${t.id} | ${esc(t.name)} | ${esc(t.cat)} | ${st.status} | ${esc(cases)} | ${esc(st.note || '')} |`,
    )
}

checklist.push('')
checklist.push('## V0 冒烟优先')
checklist.push('')
checklist.push('建议先验：`json` `base64` `url` `uuid` `hex` `yaml` `sql` `hash` `ts`')
checklist.push('')
checklist.push('重新生成：`npm run parity`')
checklist.push('')

writeFileSync(join(root, 'docs', 'parity-checklist.md'), checklist.join('\n'), 'utf-8')

// —— acceptance-matrix.md ——
const matrix = [
    '# 验收矩阵',
    '',
    `> 生成时间：${today}  `,
    `> 来源：\`data/tools.ts\` + \`data/parity-status.json\` · 共 **${tools.length}** 个工具  `,
    `> verified **${counts.verified}** · migrated **${counts.migrated}** · waived **${counts.waived}** · pending **${counts.pending}**`,
    '',
    '| id | name | cat | 状态 | 备注 |',
    '|----|------|-----|------|------|',
]

for (const t of tools) {
    const st = resolveStatus(t.id)
    matrix.push(
        `| ${t.id} | ${esc(t.name)} | ${esc(t.cat)} | ${st.status} | ${esc(st.note || '')} |`,
    )
}

matrix.push('')
matrix.push('## 状态说明')
matrix.push('')
matrix.push('| 状态 | 含义 |')
matrix.push('|------|------|')
matrix.push('| pending | 未迁移 |')
matrix.push('| migrated | 已有 Vue，待旧站对照 |')
matrix.push('| verified | 对照验收通过 |')
matrix.push('| waived | 书面豁免（多为 L4 简化） |')
matrix.push('')
matrix.push('流程：[`parity-verification.md`](./parity-verification.md) · 清单：[`parity-checklist.md`](./parity-checklist.md)')
matrix.push('')
matrix.push('刷新：`npm run parity`')
matrix.push('')

writeFileSync(join(root, 'docs', 'acceptance-matrix.md'), matrix.join('\n'), 'utf-8')

console.log(
    `[parity] checklist + matrix updated · verified=${counts.verified} migrated=${counts.migrated} waived=${counts.waived} pending=${counts.pending}`,
)
