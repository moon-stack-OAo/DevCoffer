/** Unicode \uXXXX 编解码 */

export function encodeUnicode(raw: string): string {
  let r = ''
  // 按 UTF-16 码元遍历，辅助平面会输出代理对两个 \uXXXX
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i)
    if (code < 0x80 && raw[i] !== '\\') r += raw[i]
    else r += '\\u' + code.toString(16).padStart(4, '0')
  }
  return r
}

export function decodeUnicode(raw: string): string {
  if (/\\u[0-9a-fA-F]{4}/.test(raw)) {
    return raw.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
  }
  return raw
}
