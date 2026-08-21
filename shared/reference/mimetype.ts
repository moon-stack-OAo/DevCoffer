/** MIME / Content-Type 速查 */

import type { RefGroup, RefItem } from './engine'
import { filterGroups, formatGroups, groupByField } from './engine'

export type MimeItem = { ext: string; mime: string; cat: string; desc: string }

export const MIME_TYPES: MimeItem[] = [
  { ext: '.html, .htm', mime: 'text/html', cat: '文本', desc: 'HTML 文档' },
  { ext: '.css', mime: 'text/css', cat: '文本', desc: 'CSS 样式表' },
  { ext: '.js, .mjs', mime: 'text/javascript', cat: '文本', desc: 'JavaScript' },
  { ext: '.json', mime: 'application/json', cat: '文本', desc: 'JSON 数据' },
  { ext: '.xml', mime: 'application/xml', cat: '文本', desc: 'XML 文档' },
  { ext: '.txt', mime: 'text/plain', cat: '文本', desc: '纯文本' },
  { ext: '.csv', mime: 'text/csv', cat: '文本', desc: 'CSV 表格' },
  { ext: '.md', mime: 'text/markdown', cat: '文本', desc: 'Markdown' },
  { ext: '.yml, .yaml', mime: 'application/x-yaml', cat: '文本', desc: 'YAML' },
  { ext: '.ts', mime: 'application/typescript', cat: '文本', desc: 'TypeScript' },
  { ext: '.sql', mime: 'application/sql', cat: '文本', desc: 'SQL 脚本' },
  { ext: '.png', mime: 'image/png', cat: '图片', desc: 'PNG' },
  { ext: '.jpg, .jpeg', mime: 'image/jpeg', cat: '图片', desc: 'JPEG' },
  { ext: '.gif', mime: 'image/gif', cat: '图片', desc: 'GIF' },
  { ext: '.svg', mime: 'image/svg+xml', cat: '图片', desc: 'SVG' },
  { ext: '.webp', mime: 'image/webp', cat: '图片', desc: 'WebP' },
  { ext: '.ico', mime: 'image/x-icon', cat: '图片', desc: 'favicon' },
  { ext: '.mp3', mime: 'audio/mpeg', cat: '音频', desc: 'MP3' },
  { ext: '.wav', mime: 'audio/wav', cat: '音频', desc: 'WAV' },
  { ext: '.mp4', mime: 'video/mp4', cat: '视频', desc: 'MP4' },
  { ext: '.webm', mime: 'video/webm', cat: '视频', desc: 'WebM' },
  { ext: '.pdf', mime: 'application/pdf', cat: '文档', desc: 'PDF' },
  { ext: '.zip', mime: 'application/zip', cat: '压缩', desc: 'ZIP' },
  { ext: '.gz', mime: 'application/gzip', cat: '压缩', desc: 'Gzip' },
  { ext: '.woff2', mime: 'font/woff2', cat: '字体', desc: 'WOFF2' },
  { ext: '.ttf', mime: 'font/ttf', cat: '字体', desc: 'TrueType' },
  { ext: '.form', mime: 'application/x-www-form-urlencoded', cat: 'HTTP', desc: '表单编码' },
  { ext: '.multipart', mime: 'multipart/form-data', cat: 'HTTP', desc: '文件上传' },
  { ext: '.octet', mime: 'application/octet-stream', cat: '二进制', desc: '通用二进制' },
]

function mimeToItem(x: MimeItem): RefItem {
  return {
    name: x.mime,
    pattern: x.ext,
    cat: x.cat,
    desc: x.desc,
  }
}

export function queryMime(q: string): RefGroup[] {
  const items = MIME_TYPES.map(mimeToItem)
  return filterGroups(groupByField(items, 'cat'), q)
}

export function searchMime(q: string): string {
  const groups = queryMime(q)
  if (!groups.length) return '无匹配'
  return formatGroups(groups)
}
