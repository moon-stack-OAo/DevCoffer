/** JSON ↔ Excel 辅助：示例、错误中文化 */

export const JSONEXCEL_SAMPLE = `[
  {"id": 1, "name": "张三", "age": 28},
  {"id": 2, "name": "李四", "age": 32}
]`

/** 将 JSON.parse / SheetJS 等英文异常转为中文友好文案 */
export function toFriendlyJsonExcelError(e: unknown, mode: 'j2x' | 'x2j' = 'j2x'): string {
  const msg = e instanceof Error ? e.message : String(e || '')
  if (!msg) return mode === 'j2x' ? '转换失败' : '解析失败'

  // 已是中文则原样返回
  if (/[\u4e00-\u9fff]/.test(msg)) return msg

  if (/unexpected token|unexpected end|json/i.test(msg) || /SyntaxError/i.test(String(e))) {
    return 'JSON 格式无效：请检查是否为合法 JSON（数组或对象）'
  }
  if (/is not valid json/i.test(msg)) {
    return 'JSON 格式无效：请检查引号、逗号与括号是否匹配'
  }
  if (/unsupported file|corrupt|invalid|password/i.test(msg)) {
    return 'Excel 文件无法读取：请确认是合法的 xlsx / xls / csv'
  }
  return (mode === 'j2x' ? '转换失败：' : '解析失败：') + msg
}
