/** Java Pattern 与 JS RegExp 差异说明 + 简单转义提示 */

export const JAVA_REGEX_NOTES = `
=== Java Pattern vs JS RegExp（要点） ===
1. Java 字符串字面量中 \\ 需双写：Java "\\\\d" ≡ 模式 \\d ≡ JS /\\d/
2. Java 命名组：(?<name>...)；JS 同样支持（较新引擎）
3. Java 具备 \\A \\z \\G \\p{...} 等；浏览器 JS \\p{Letter} 需 u 标志
4. Java matches() 是整串匹配；JS test() 默认非锚定（可加 ^$）
5. Java Pattern.COMMENTS / CASE_INSENSITIVE / DOTALL / MULTILINE / UNICODE_CASE
   ↔ JS 标志：i, m, s, u, y
6. 替换：Java replaceAll 用 $1；JS 同。Java 字面 $ 用 \\$
`.trim()

export function javaPatternFromJs(jsPattern: string, flags = ''): string {
  const p = String(jsPattern || '')
  // 展示 Java 字符串字面量形式
  const escaped = p.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const flagHints: string[] = []
  if (flags.includes('i')) flagHints.push('Pattern.CASE_INSENSITIVE')
  if (flags.includes('m')) flagHints.push('Pattern.MULTILINE')
  if (flags.includes('s')) flagHints.push('Pattern.DOTALL')
  if (flags.includes('u')) flagHints.push('Pattern.UNICODE_CHARACTER_CLASS')
  const flagsJava = flagHints.length ? ', ' + flagHints.join(' | ') : ''
  return [
    JAVA_REGEX_NOTES,
    '',
    '=== 转换 ===',
    `JS: /${p}/${flags}`,
    `Java String: "${escaped}"`,
    `Pattern.compile("${escaped}"${flagsJava});`,
  ].join('\n')
}
