/** URL 解析 */

export function parseUrl(input: string): string {
  const raw = String(input || '').trim()
  if (!raw) throw new Error('请输入 URL')
  let url: URL
  try {
    url = new URL(raw)
  } catch (e) {
    throw new Error('无效的 URL: ' + (e instanceof Error ? e.message : String(e)))
  }
  const lines: string[] = []
  lines.push('协议 (protocol) : ' + url.protocol)
  lines.push('用户名 (username): ' + (url.username || '(空)'))
  lines.push('密码 (password)  : ' + (url.password || '(空)'))
  lines.push('主机 (host)     : ' + url.hostname)
  lines.push('端口 (port)     : ' + (url.port || '(默认)'))
  lines.push('完整 host:port  : ' + url.host)
  lines.push('源 (origin)     : ' + url.origin)
  lines.push('路径 (pathname) : ' + url.pathname)
  lines.push('查询字符串 (search) : ' + (url.search || '(空)'))
  lines.push('Hash (hash)     : ' + (url.hash || '(空)'))
  lines.push('Href            : ' + url.href)

  const params: Array<{ key: string; value: string }> = []
  url.searchParams.forEach((v, k) => params.push({ key: k, value: v }))
  if (params.length) {
    lines.push('')
    lines.push('查询参数 (解析) :')
    params.forEach((p, i) => lines.push(`  ${i + 1}. ${p.key} = ${p.value}`))
    const obj: Record<string, string | string[]> = {}
    params.forEach((p) => {
      if (obj[p.key] !== undefined) {
        if (!Array.isArray(obj[p.key])) obj[p.key] = [obj[p.key] as string]
        ;(obj[p.key] as string[]).push(p.value)
      } else obj[p.key] = p.value
    })
    lines.push('')
    lines.push('查询参数 (对象) :')
    lines.push(JSON.stringify(obj, null, 2))
  } else {
    lines.push('')
    lines.push('查询参数 (解析) : (空)')
  }
  return lines.join('\n')
}
