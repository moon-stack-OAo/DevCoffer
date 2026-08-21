/** .env 解析 / 格式化 / 校验 */

export type EnvEntry = { key: string; value: string; export: boolean; raw: string; line: number }

export type EnvParseIssue = {
  line: number
  message: string
}

export type EnvParseResult = {
  entries: EnvEntry[]
  map: Record<string, string>
  duplicates: Array<{ key: string; lines: number[] }>
  /** 解析过程中发现的问题 */
  issues: EnvParseIssue[]
}

/** 合法 env key：字母/下划线开头，后接字母数字下划线 */
const ENV_KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/

function envUnquote(raw: string): string {
  let v = raw == null ? '' : String(raw)
  if (v.length >= 2) {
    const q = v[0]
    if ((q === '"' || q === "'") && v[v.length - 1] === q) {
      const inner = v.slice(1, -1)
      if (q === '"') {
        return inner
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\')
          .replace(/\\"/g, '"')
      }
      return inner.replace(/\\'/g, "'")
    }
  }
  const hash = v.search(/(^|[^\\])\s+#/)
  if (hash >= 0) {
    const at = v[hash] === '#' ? hash : v.indexOf('#', hash)
    v = v.slice(0, at).trimEnd()
  } else if (v.indexOf('#') === 0) {
    v = ''
  }
  return v.trim()
}

export function parseEnv(text: string): EnvParseResult {
  const entries: EnvEntry[] = []
  const map: Record<string, string> = Object.create(null)
  const keyLines: Record<string, number[]> = Object.create(null)
  const duplicates: Array<{ key: string; lines: number[] }> = []
  const issues: EnvParseIssue[] = []
  const lines = String(text ?? '').split(/\r?\n/)

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1
    const raw = lines[i]!
    const trimmed = raw.trim()
    if (!trimmed || trimmed[0] === '#') continue

    let work = trimmed
    let isExport = false
    if (/^export\s+/i.test(work)) {
      isExport = true
      work = work.replace(/^export\s+/i, '')
    }

    const eq = work.indexOf('=')
    if (eq < 0) {
      issues.push({ line: lineNo, message: '非法行：缺少 "="' })
      continue
    }

    const key = work.slice(0, eq).trim()
    if (!key) {
      issues.push({ line: lineNo, message: '键名不能为空（形如 =value）' })
      continue
    }
    if (/\s/.test(key) || !ENV_KEY_RE.test(key)) {
      issues.push({
        line: lineNo,
        message: '非法 key「' + key + '」（仅允许字母/数字/下划线，且不能以数字开头、不能含空格）',
      })
      continue
    }

    const value = envUnquote(work.slice(eq + 1).replace(/^\s+/, ''))
    entries.push({ key, value, export: isExport, raw, line: lineNo })
    if (keyLines[key]) {
      keyLines[key]!.push(lineNo)
      let dup = duplicates.find((d) => d.key === key)
      if (!dup) {
        dup = { key, lines: keyLines[key]!.slice() }
        duplicates.push(dup)
      } else {
        dup.lines = keyLines[key]!.slice()
      }
      // 重复不写入 issues，由 validate 单独判定；format 去重保留最后一次
    } else {
      keyLines[key] = [lineNo]
    }
    map[key] = value
  }
  return { entries, map, duplicates, issues }
}

export type FormatEnvOptions = {
  sort?: boolean
  exportPrefix?: boolean
  quote?: boolean
  removeEmpty?: boolean
  /** 为 true 时遇非法行抛错（默认 true） */
  strict?: boolean
}

export function formatEnv(
  input: string | EnvParseResult | Record<string, string>,
  options: FormatEnvOptions = {},
): string {
  const strict = options.strict !== false
  let pairs: Array<{ key: string; value: string; export: boolean }> = []

  if (typeof input === 'string') {
    const raw = String(input ?? '').trim()
    if (!raw) throw new Error('请输入 .env')
    const parsed = parseEnv(input)
    if (strict && parsed.issues.length) {
      const detail = parsed.issues
        .slice(0, 8)
        .map((x) => `第 ${x.line} 行：${x.message}`)
        .join('；')
      throw new Error('.env 格式无效：' + detail)
    }
    pairs = parsed.entries.map((e) => ({ key: e.key, value: e.value, export: e.export }))
    const seen: Record<string, boolean> = Object.create(null)
    const deduped: typeof pairs = []
    for (let i = pairs.length - 1; i >= 0; i--) {
      const p = pairs[i]!
      if (seen[p.key]) continue
      seen[p.key] = true
      deduped.unshift(p)
    }
    pairs = deduped
  } else if (input && Array.isArray((input as EnvParseResult).entries)) {
    const parsed = input as EnvParseResult
    if (strict && parsed.issues?.length) {
      const detail = parsed.issues
        .slice(0, 8)
        .map((x) => `第 ${x.line} 行：${x.message}`)
        .join('；')
      throw new Error('.env 格式无效：' + detail)
    }
    pairs = parsed.entries.map((e) => ({
      key: e.key,
      value: e.value,
      export: !!e.export,
    }))
  } else if (input && typeof input === 'object') {
    Object.keys(input as object).forEach((k) => {
      pairs.push({ key: k, value: String((input as Record<string, unknown>)[k] ?? ''), export: false })
    })
  }

  if (options.removeEmpty) pairs = pairs.filter((p) => p.value !== '')
  if (options.sort) {
    pairs = pairs.slice().sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
  }

  let maxKey = 0
  pairs.forEach((p) => {
    if (p.key.length > maxKey) maxKey = p.key.length
  })

  return pairs
    .map((p) => {
      const prefix = options.exportPrefix || p.export ? 'export ' : ''
      const keyPad = p.key + ' '.repeat(Math.max(0, maxKey - p.key.length))
      let val = p.value == null ? '' : String(p.value)
      const needQuote =
        options.quote || /[\s#"']/.test(val) || val.indexOf('=') >= 0 || val.indexOf('\n') >= 0
      if (needQuote) {
        val =
          '"' +
          val
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t') +
          '"'
      }
      return prefix + keyPad + ' = ' + val
    })
    .join('\n')
}

/** 校验；失败抛错供 UI setError，成功返回「通过」+ 统计 */
export function validateEnv(text: string): string {
  const raw = String(text ?? '').trim()
  if (!raw) throw new Error('请输入 .env')
  const parsed = parseEnv(raw)
  const errors: string[] = []
  for (const x of parsed.issues) {
    errors.push(`第 ${x.line} 行：${x.message}`)
  }
  for (const d of parsed.duplicates) {
    errors.push(`重复 key: ${d.key}（行 ${d.lines.join(', ')}）`)
  }
  if (errors.length) {
    throw new Error('校验未通过：\n' + errors.slice(0, 12).join('\n'))
  }
  return [
    '校验通过',
    '条目数: ' + parsed.entries.length,
    '唯一 key: ' + Object.keys(parsed.map).length,
    '重复 key: 无',
  ].join('\n')
}

export const ENV_SAMPLE = [
  '# 示例环境变量',
  'APP_NAME=demo',
  'APP_PORT=8080',
  'DEBUG=true',
  'DB_HOST=localhost',
].join('\n')
