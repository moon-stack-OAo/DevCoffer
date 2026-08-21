/** W3C traceparent / tracestate / b3 解析与生成 */

function randomHex(bytes: number): string {
  const n = bytes * 2
  let s = ''
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(bytes)
    crypto.getRandomValues(arr)
    for (let i = 0; i < arr.length; i++) s += arr[i]!.toString(16).padStart(2, '0')
    return s
  }
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 16).toString(16)
  return s
}

export function generateTraceId(): string {
  let id = randomHex(16)
  if (/^0+$/.test(id)) id = '0'.repeat(31) + '1'
  return id
}

export function generateSpanId(): string {
  let id = randomHex(8)
  if (/^0+$/.test(id)) id = '0'.repeat(15) + '1'
  return id
}

export function parseTraceparent(header: string): {
  valid: boolean
  version?: string
  traceId?: string
  spanId?: string
  flags?: string
  sampled?: boolean
  message?: string
} {
  if (header == null || String(header).trim() === '') {
    return { valid: false, message: '请输入 traceparent' }
  }
  const s = String(header).trim()
  const parts = s.split('-')
  if (parts.length !== 4) {
    return { valid: false, message: '格式错误，须为 version-traceid-spanid-flags' }
  }
  const [version, traceId, spanId, flags] = parts
  if (!/^[0-9a-fA-F]{2}$/.test(version!)) return { valid: false, message: 'version 须为 2 位 hex' }
  if (!/^[0-9a-fA-F]{32}$/.test(traceId!)) return { valid: false, message: 'trace-id 须为 32 位 hex' }
  if (/^0+$/.test(traceId!)) return { valid: false, message: 'trace-id 不能全 0' }
  if (!/^[0-9a-fA-F]{16}$/.test(spanId!)) return { valid: false, message: 'span-id 须为 16 位 hex' }
  if (/^0+$/.test(spanId!)) return { valid: false, message: 'span-id 不能全 0' }
  if (!/^[0-9a-fA-F]{2}$/.test(flags!)) return { valid: false, message: 'flags 须为 2 位 hex' }
  const flagNum = parseInt(flags!, 16)
  return {
    valid: true,
    version: version!.toLowerCase(),
    traceId: traceId!.toLowerCase(),
    spanId: spanId!.toLowerCase(),
    flags: flags!.toLowerCase(),
    sampled: (flagNum & 0x01) === 1,
    message: '解析成功',
  }
}

export function buildTraceparent(opts: {
  version?: string
  traceId?: string
  spanId?: string
  sampled?: boolean
  flags?: string
} = {}): string {
  const version = (opts.version || '00').toLowerCase()
  if (!/^[0-9a-f]{2}$/.test(version)) throw new Error('version 须为 2 位 hex')
  let traceId = (opts.traceId || generateTraceId()).toLowerCase()
  let spanId = (opts.spanId || generateSpanId()).toLowerCase()
  if (!/^[0-9a-f]{32}$/.test(traceId) || /^0+$/.test(traceId)) throw new Error('traceId 无效')
  if (!/^[0-9a-f]{16}$/.test(spanId) || /^0+$/.test(spanId)) throw new Error('spanId 无效')
  let flags: string
  if (opts.flags != null && opts.flags !== '') {
    flags = String(opts.flags).toLowerCase()
    if (!/^[0-9a-f]{2}$/.test(flags)) throw new Error('flags 须为 2 位 hex')
  } else {
    flags = (opts.sampled === undefined ? true : !!opts.sampled) ? '01' : '00'
  }
  return `${version}-${traceId}-${spanId}-${flags}`
}

function buildB3Headers(
  traceId: string,
  spanId: string,
  sampled?: boolean | string,
  parentSpanId?: string,
): Record<string, string> {
  const h: Record<string, string> = {
    'X-B3-TraceId': traceId,
    'X-B3-SpanId': spanId,
  }
  if (parentSpanId) h['X-B3-ParentSpanId'] = parentSpanId
  if (sampled === 'd') h['X-B3-Flags'] = '1'
  else if (sampled === true) h['X-B3-Sampled'] = '1'
  else if (sampled === false) h['X-B3-Sampled'] = '0'
  return h
}

function parseB3Single(s: string) {
  const parts = s.split('-')
  if (parts.length < 2 || parts.length > 4) {
    return { valid: false as const, message: 'B3 单头格式: TraceId-SpanId[-Sampled[-ParentSpanId]]' }
  }
  const traceId = parts[0]!.toLowerCase()
  const spanId = parts[1]!.toLowerCase()
  if (!/^[0-9a-f]{16}$|^[0-9a-f]{32}$/.test(traceId)) {
    return { valid: false as const, message: 'TraceId 须为 16 或 32 位 hex' }
  }
  if (!/^[0-9a-f]{16}$/.test(spanId)) {
    return { valid: false as const, message: 'SpanId 须为 16 位 hex' }
  }
  let sampled: boolean | string | undefined
  let parentSpanId: string | undefined
  if (parts.length >= 3) {
    const st = parts[2]!
    if (st === '0' || st === '1' || st === 'd') sampled = st === 'd' ? 'd' : st === '1'
    else return { valid: false as const, message: 'SamplingState 须为 0/1/d' }
  }
  if (parts.length === 4) {
    parentSpanId = parts[3]!.toLowerCase()
    if (!/^[0-9a-f]{16}$/.test(parentSpanId)) {
      return { valid: false as const, message: 'ParentSpanId 须为 16 位 hex' }
    }
  }
  return {
    valid: true as const,
    format: 'single' as const,
    traceId,
    spanId,
    parentSpanId,
    sampled,
    message: 'B3 单头解析成功',
    headers: buildB3Headers(traceId, spanId, sampled, parentSpanId),
  }
}

function parseB3Multi(obj: Record<string, string>) {
  const map: Record<string, string> = Object.create(null)
  Object.keys(obj).forEach((k) => {
    map[k.toLowerCase()] = String(obj[k]).trim()
  })
  const traceId = (map['x-b3-traceid'] || '').toLowerCase()
  const spanId = (map['x-b3-spanid'] || '').toLowerCase()
  const parentSpanId = (map['x-b3-parentspanid'] || '').toLowerCase() || undefined
  const sampledRaw = map['x-b3-sampled']
  const flags = map['x-b3-flags']
  if (!traceId) return { valid: false as const, message: '缺少 X-B3-TraceId' }
  if (!/^[0-9a-f]{16}$|^[0-9a-f]{32}$/.test(traceId)) {
    return { valid: false as const, message: 'X-B3-TraceId 须为 16 或 32 位 hex' }
  }
  if (!spanId || !/^[0-9a-f]{16}$/.test(spanId)) {
    return { valid: false as const, message: 'X-B3-SpanId 须为 16 位 hex' }
  }
  if (parentSpanId && !/^[0-9a-f]{16}$/.test(parentSpanId)) {
    return { valid: false as const, message: 'X-B3-ParentSpanId 须为 16 位 hex' }
  }
  let sampled: boolean | string | undefined
  if (flags === '1') sampled = 'd'
  else if (sampledRaw === '1' || sampledRaw === 'true') sampled = true
  else if (sampledRaw === '0' || sampledRaw === 'false') sampled = false
  return {
    valid: true as const,
    format: 'multi' as const,
    traceId,
    spanId,
    parentSpanId,
    sampled,
    message: 'B3 多头解析成功',
    headers: buildB3Headers(traceId, spanId, sampled, parentSpanId),
  }
}

export function parseB3(input: string | Record<string, string>) {
  if (input == null || (typeof input === 'string' && !input.trim())) {
    return { valid: false as const, message: '请输入 B3 头' }
  }
  if (typeof input === 'object' && !Array.isArray(input)) return parseB3Multi(input)
  const s = String(input).trim()
  if (s.includes('\n') || /x-b3-/i.test(s)) {
    const headers: Record<string, string> = {}
    s.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([^:=\s]+)\s*[:=]\s*(.+?)\s*$/)
      if (m) headers[m[1]!.trim()] = m[2]!.trim()
    })
    if (Object.keys(headers).length) {
      const b3Key = Object.keys(headers).find((k) => k.toLowerCase() === 'b3')
      if (b3Key && !headers['X-B3-TraceId'] && !headers['x-b3-traceid']) {
        return parseB3Single(headers[b3Key]!)
      }
      return parseB3Multi(headers)
    }
  }
  return parseB3Single(s)
}

export function buildB3(opts: {
  traceId?: string
  spanId?: string
  parentSpanId?: string
  sampled?: boolean | string
  format?: 'single' | 'multi'
} = {}): { single: string; multi: Record<string, string>; headersText: string } {
  let traceId = (opts.traceId || generateTraceId()).toLowerCase()
  let spanId = (opts.spanId || generateSpanId()).toLowerCase()
  if (!/^[0-9a-f]{16}$|^[0-9a-f]{32}$/.test(traceId) || /^0+$/.test(traceId)) {
    throw new Error('traceId 无效')
  }
  if (!/^[0-9a-f]{16}$/.test(spanId) || /^0+$/.test(spanId)) throw new Error('spanId 无效')
  const parentSpanId = opts.parentSpanId ? String(opts.parentSpanId).toLowerCase() : undefined
  if (parentSpanId && !/^[0-9a-f]{16}$/.test(parentSpanId)) throw new Error('parentSpanId 无效')
  const sampled = opts.sampled === undefined ? true : opts.sampled
  const multi = buildB3Headers(traceId, spanId, sampled, parentSpanId)
  let single = `${traceId}-${spanId}`
  if (sampled === 'd') single += '-d'
  else if (sampled === true) single += '-1'
  else if (sampled === false) single += '-0'
  if (parentSpanId && (sampled === true || sampled === false || sampled === 'd')) {
    single += '-' + parentSpanId
  }
  const headersText = Object.entries(multi)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
  return { single, multi, headersText }
}

export function parseTraceHeaders(input: string): string {
  const text = String(input || '').trim()
  if (!text) throw new Error('请输入 traceparent / tracestate / b3 头')
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const out: string[] = []

  // 整段可能是多头 B3
  if (/x-b3-/i.test(text) || (lines.length > 1 && lines.every((l) => /:|=/.test(l)))) {
    const b3 = parseB3(text)
    if (b3.valid) {
      out.push(
        '=== B3 ===',
        `format: ${b3.format}`,
        `traceId: ${b3.traceId}`,
        `spanId: ${b3.spanId}`,
        b3.parentSpanId ? `parentSpanId: ${b3.parentSpanId}` : '',
        `sampled: ${String(b3.sampled)}`,
        '',
        '等价多头:',
        ...Object.entries(b3.headers || {}).map(([k, v]) => `${k}: ${v}`),
      )
      return out.filter(Boolean).join('\n')
    }
  }

  for (const line of lines) {
    let name = ''
    let value = line
    const idx = line.indexOf(':')
    if (idx > 0 && idx < 40) {
      name = line.slice(0, idx).trim().toLowerCase()
      value = line.slice(idx + 1).trim()
    } else if (/^[\da-f]{2}-[\da-f-]+/i.test(line)) {
      name = 'traceparent'
    } else if (/^[\da-f]{16,32}-[\da-f]/i.test(line)) {
      name = 'b3'
    }

    if (name === 'traceparent' || (!name && value.split('-').length === 4)) {
      const r = parseTraceparent(value)
      if (r.valid) {
        out.push(
          '=== traceparent ===',
          `version: ${r.version}`,
          `trace-id: ${r.traceId}`,
          `parent-id / span-id: ${r.spanId}`,
          `flags: ${r.flags} (sampled=${r.sampled ? 'yes' : 'no'})`,
          '',
        )
      } else {
        out.push(`traceparent 解析失败: ${r.message}`, '')
      }
    } else if (name === 'tracestate') {
      out.push('=== tracestate ===', value, '')
    } else if (name === 'b3' || name === 'x-b3-traceid') {
      const r = parseB3(name === 'b3' ? value : text)
      if (r.valid) {
        out.push(
          '=== b3 ===',
          `traceId: ${r.traceId}`,
          `spanId: ${r.spanId}`,
          `sampled: ${String(r.sampled)}`,
          '',
        )
      } else {
        out.push(`b3: ${value}`, r.message || '', '')
      }
    } else {
      out.push(`${name || 'raw'}: ${value}`, '')
    }
  }
  return out.join('\n').trimEnd() || '无法解析'
}

export function formatTraceGenerate(sampled = true): string {
  const tp = buildTraceparent({ sampled })
  const b3 = buildB3({ sampled })
  return [
    '=== 生成 ===',
    `traceparent: ${tp}`,
    `b3 (single): ${b3.single}`,
    '',
    'B3 多头:',
    b3.headersText,
  ].join('\n')
}
