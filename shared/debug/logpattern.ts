/** Logback / Log4j pattern 常见转换符说明 + 简单标注 */

const TOKENS: { token: string; desc: string }[] = [
  { token: '%d', desc: '日期时间；可 %d{yyyy-MM-dd HH:mm:ss.SSS}' },
  { token: '%date', desc: '同 %d' },
  { token: '%thread', desc: '线程名' },
  { token: '%t', desc: '线程名简写' },
  { token: '%level', desc: '日志级别' },
  { token: '%p', desc: '优先级/级别简写' },
  { token: '%logger', desc: 'logger 名；%logger{36} 缩写' },
  { token: '%c', desc: '同 %logger' },
  { token: '%msg', desc: '日志消息' },
  { token: '%m', desc: '同 %msg' },
  { token: '%n', desc: '换行' },
  { token: '%X', desc: 'MDC；%X{key}' },
  { token: '%mdc', desc: '同 %X' },
  { token: '%ex', desc: '异常堆栈' },
  { token: '%exception', desc: '同 %ex' },
  { token: '%F', desc: '文件名' },
  { token: '%L', desc: '行号' },
  { token: '%M', desc: '方法名' },
  { token: '%C', desc: '调用者类名' },
  { token: '%highlight', desc: '控制台着色（Logback）' },
  { token: '%cyan', desc: '颜色（Logback）' },
  { token: '%-5level', desc: '左对齐宽度示例' },
]

export function explainLogPattern(pattern: string): string {
  const p = String(pattern || '').trim()
  if (!p) {
    return [
      '=== 常用转换符 ===',
      ...TOKENS.map((t) => `${t.token.padEnd(14)} ${t.desc}`),
      '',
      '示例: %d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n',
    ].join('\n')
  }
  const found: string[] = []
  for (const t of TOKENS) {
    if (p.includes(t.token.replace(/^-?\d*/, ''))) {
      // 更稳：用 token 核心
    }
  }
  const re = /%[-.]?\d*[a-zA-Z]+(?:\{[^}]*\})?/g
  const matches = p.match(re) || []
  for (const m of matches) {
    const core = m.replace(/%[-.]?\d*/, '%').replace(/\{[^}]*\}/, '')
    const hit = TOKENS.find((t) => t.token === core || t.token.startsWith(core) || core.startsWith(t.token))
    found.push(hit ? `${m} → ${hit.desc}` : `${m} → (未收录，请查官方文档)`)
  }
  return [
    `Pattern: ${p}`,
    '',
    '=== 识别到的转换符 ===',
    ...(found.length ? found : ['(未识别到 %xxx，请检查输入)']),
    '',
    '=== 速查 ===',
    ...TOKENS.slice(0, 12).map((t) => `${t.token.padEnd(14)} ${t.desc}`),
  ].join('\n')
}
