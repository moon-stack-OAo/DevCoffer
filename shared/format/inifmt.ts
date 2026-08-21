/** INI 解析 / 格式化 / 校验 */

export type IniEntry = { key: string; value: string; line: number }
export type IniSection = { name: string; entries: IniEntry[] }

export type IniParseIssue = {
  line: number
  message: string
}

export type IniParseResult = {
  sections: IniSection[]
  map: Record<string, Record<string, string>>
  duplicates: Array<{ section: string; key: string; lines: number[] }>
  /** 解析过程中发现的问题（非法行等） */
  issues: IniParseIssue[]
}

function iniUnquote(raw: string): string {
  let v = String(raw || '').trim()
  if (v.length >= 2) {
    const q = v[0]
    if ((q === '"' || q === "'") && v[v.length - 1] === q) return v.slice(1, -1)
  }
  return v
}

export function parseIni(text: string): IniParseResult {
  const sections: IniSection[] = []
  const map: Record<string, Record<string, string>> = Object.create(null)
  const duplicates: Array<{ section: string; key: string; lines: number[] }> = []
  const issues: IniParseIssue[] = []
  const keyLines: Record<string, number[]> = Object.create(null)

  let current: IniSection = { name: '', entries: [] }
  sections.push(current)
  map[''] = Object.create(null)

  const lines = String(text ?? '').split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1
    const raw = lines[i]!
    const trimmed = raw.trim()
    if (!trimmed || trimmed[0] === '#' || trimmed[0] === ';') continue

    // section：必须成对括号且名称非空
    if (trimmed[0] === '[') {
      const sec = trimmed.match(/^\[([^\]]*)\]\s*$/)
      if (!sec) {
        issues.push({ line: lineNo, message: '非法 section 行（缺少 "]" 或格式错误）' })
        continue
      }
      const name = sec[1]!.trim()
      if (!name) {
        issues.push({ line: lineNo, message: 'section 名称不能为空' })
        continue
      }
      current = { name, entries: [] }
      sections.push(current)
      if (!map[name]) map[name] = Object.create(null)
      continue
    }

    let eq = trimmed.indexOf('=')
    const colon = trimmed.indexOf(':')
    if (eq < 0 || (colon >= 0 && colon < eq)) eq = colon
    if (eq < 0) {
      issues.push({ line: lineNo, message: '非法行：缺少 "=" 或 ":"' })
      continue
    }

    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (!(value[0] === '"' || value[0] === "'")) value = value.replace(/\s+[;#].*$/, '')
    else value = iniUnquote(value)
    if (!key) {
      issues.push({ line: lineNo, message: '键名不能为空' })
      continue
    }

    current.entries.push({ key, value, line: lineNo })
    const secName = current.name
    const dupKey = secName + '\0' + key
    if (keyLines[dupKey]) {
      keyLines[dupKey]!.push(lineNo)
      let dup = duplicates.find((d) => d.section === secName && d.key === key)
      if (!dup) duplicates.push({ section: secName, key, lines: keyLines[dupKey]!.slice() })
      else dup.lines = keyLines[dupKey]!.slice()
    } else {
      keyLines[dupKey] = [lineNo]
    }
    if (!map[secName]) map[secName] = Object.create(null)
    map[secName]![key] = value
  }

  if (sections.length > 1 && sections[0]!.name === '' && sections[0]!.entries.length === 0) {
    sections.shift()
  }

  return { sections, map, duplicates, issues }
}

export type FormatIniOptions = {
  sort?: boolean
  dedupe?: boolean
  separator?: string
  /** 为 true 时遇非法行抛错（默认 true） */
  strict?: boolean
}

export function formatIni(input: string | IniParseResult, options: FormatIniOptions = {}): string {
  const dedupe = options.dedupe !== false
  const sort = !!options.sort
  const sep = options.separator != null ? options.separator : ' = '
  const strict = options.strict !== false

  let sections: Array<{ name: string; entries: Array<{ key: string; value: string }> }> = []
  if (typeof input === 'string') {
    const parsed = parseIni(input)
    if (strict && parsed.issues.length) {
      const detail = parsed.issues
        .slice(0, 8)
        .map((x) => `第 ${x.line} 行：${x.message}`)
        .join('；')
      throw new Error('INI 格式无效：' + detail)
    }
    sections = parsed.sections.map((s) => ({
      name: s.name,
      entries: s.entries.map((e) => ({ key: e.key, value: e.value })),
    }))
  } else {
    if (strict && input.issues?.length) {
      const detail = input.issues
        .slice(0, 8)
        .map((x) => `第 ${x.line} 行：${x.message}`)
        .join('；')
      throw new Error('INI 格式无效：' + detail)
    }
    sections = input.sections.map((s) => ({
      name: s.name,
      entries: (s.entries || []).map((e) => ({ key: e.key, value: e.value })),
    }))
  }

  if (dedupe) {
    sections = sections.map((s) => {
      const seen: Record<string, boolean> = Object.create(null)
      const entries: typeof s.entries = []
      for (let i = s.entries.length - 1; i >= 0; i--) {
        const e = s.entries[i]!
        if (seen[e.key]) continue
        seen[e.key] = true
        entries.unshift(e)
      }
      return { name: s.name, entries }
    })
  }

  if (sort) {
    sections = sections.slice().sort((a, b) => {
      if (a.name === '') return -1
      if (b.name === '') return 1
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    })
    sections.forEach((s) => {
      s.entries = s.entries.slice().sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    })
  }

  const out: string[] = []
  sections.forEach((s, idx) => {
    if (s.name) {
      if (out.length) out.push('')
      out.push('[' + s.name + ']')
    } else if (idx > 0 && out.length) {
      out.push('')
    }
    let maxKey = 0
    s.entries.forEach((e) => {
      if (e.key.length > maxKey) maxKey = e.key.length
    })
    s.entries.forEach((e) => {
      const keyPad = e.key + ' '.repeat(Math.max(0, maxKey - e.key.length))
      out.push(keyPad + sep + e.value)
    })
  })
  return out.join('\n')
}

/** 校验结果文本；有 issues 时抛错供 UI setError */
export function validateIni(text: string): string {
  const raw = String(text ?? '').trim()
  if (!raw) throw new Error('请输入 INI')
  const p = parseIni(raw)
  if (p.issues.length) {
    const detail = p.issues
      .slice(0, 12)
      .map((x) => `第 ${x.line} 行：${x.message}`)
      .join('\n')
    throw new Error('校验未通过：\n' + detail)
  }
  const keyCount = p.sections.reduce((n, s) => n + s.entries.length, 0)
  return [
    '校验通过',
    'sections: ' + p.sections.length,
    'keys: ' + keyCount,
    'duplicates: ' +
      (p.duplicates.length
        ? p.duplicates.map((d) => (d.section || '(root)') + '.' + d.key).join(', ')
        : '无'),
  ].join('\n')
}

export const INI_SAMPLE =
  '[db]\n' +
  'host = localhost\n' +
  'port = 3306\n' +
  '\n' +
  '[app]\n' +
  'name = demo\n' +
  'debug = true\n'
