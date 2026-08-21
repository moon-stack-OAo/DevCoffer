/** 简化 PEM 文本字段解析（非完整 ASN.1） */
export function parsePemCert(pem: string): string {
  const text = String(pem || '').trim()
  if (!text) throw new Error('请粘贴 PEM')
  const lines: string[] = []
  const begin = text.match(/-----BEGIN ([^-]+)-----/)
  const end = text.match(/-----END ([^-]+)-----/)
  lines.push('类型: ' + (begin?.[1] || '(未识别)'))
  if (begin && end && begin[1] !== end[1]) lines.push('警告: BEGIN/END 标签不一致')
  const b64 = text.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  lines.push('Base64 长度: ' + b64.length)
  lines.push('约 DER 字节: ' + Math.floor(b64.length * 3 / 4))
  // 常见文本属性（若 PEM 旁附带）
  const subject = text.match(/Subject:\s*(.+)/i)
  const issuer = text.match(/Issuer:\s*(.+)/i)
  const notBefore = text.match(/Not Before\s*:?\s*(.+)/i)
  const notAfter = text.match(/Not After\s*:?\s*(.+)/i)
  const sn = text.match(/Serial Number:\s*(.+)/i)
  if (subject) lines.push('Subject: ' + subject[1])
  if (issuer) lines.push('Issuer: ' + issuer[1])
  if (sn) lines.push('Serial: ' + sn[1])
  if (notBefore) lines.push('Not Before: ' + notBefore[1])
  if (notAfter) lines.push('Not After: ' + notAfter[1])
  // 从 base64 里粗略找 OID 可读串（极简）
  try {
    const bin = atob(b64)
    const printable = bin.replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim()
    const cn = printable.match(/CN=([^,\/]+)/)
    const o = printable.match(/O=([^,\/]+)/)
    if (cn) lines.push('疑似 CN: ' + cn[1])
    if (o) lines.push('疑似 O: ' + o[1])
    if (printable.length > 40) lines.push('可读片段: ' + printable.slice(0, 200) + (printable.length > 200 ? '…' : ''))
  } catch { /* ignore */ }
  lines.push('', '说明: 完整 X.509 ASN.1 解析需专业库；此处为 PEM 文本级摘要')
  return lines.join('\n')
}
