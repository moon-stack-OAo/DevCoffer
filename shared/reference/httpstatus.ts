/** HTTP 状态码 / 方法速查 */

import type { RefGroup, RefItem } from './engine'
import { filterGroups, formatGroups } from './engine'

export type HttpStatusItem = { code: number; text: string; desc: string }

export const HTTP_STATUS: Record<string, HttpStatusItem[]> = {
  '1xx': [
    { code: 100, text: 'Continue', desc: '继续' },
    { code: 101, text: 'Switching Protocols', desc: '切换协议' },
  ],
  '2xx': [
    { code: 200, text: 'OK', desc: '请求成功' },
    { code: 201, text: 'Created', desc: '已创建' },
    { code: 202, text: 'Accepted', desc: '已接受' },
    { code: 204, text: 'No Content', desc: '无内容' },
    { code: 206, text: 'Partial Content', desc: '部分内容' },
  ],
  '3xx': [
    { code: 301, text: 'Moved Permanently', desc: '永久重定向' },
    { code: 302, text: 'Found', desc: '临时重定向' },
    { code: 304, text: 'Not Modified', desc: '未修改' },
    { code: 307, text: 'Temporary Redirect', desc: '临时重定向(保持方法)' },
    { code: 308, text: 'Permanent Redirect', desc: '永久重定向(保持方法)' },
  ],
  '4xx': [
    { code: 400, text: 'Bad Request', desc: '请求错误' },
    { code: 401, text: 'Unauthorized', desc: '未授权' },
    { code: 403, text: 'Forbidden', desc: '禁止访问' },
    { code: 404, text: 'Not Found', desc: '未找到' },
    { code: 405, text: 'Method Not Allowed', desc: '方法不允许' },
    { code: 408, text: 'Request Timeout', desc: '请求超时' },
    { code: 409, text: 'Conflict', desc: '冲突' },
    { code: 415, text: 'Unsupported Media Type', desc: '不支持的媒体类型' },
    { code: 422, text: 'Unprocessable Entity', desc: '无法处理的实体' },
    { code: 429, text: 'Too Many Requests', desc: '请求过多' },
  ],
  '5xx': [
    { code: 500, text: 'Internal Server Error', desc: '服务器内部错误' },
    { code: 501, text: 'Not Implemented', desc: '未实现' },
    { code: 502, text: 'Bad Gateway', desc: '网关错误' },
    { code: 503, text: 'Service Unavailable', desc: '服务不可用' },
    { code: 504, text: 'Gateway Timeout', desc: '网关超时' },
  ],
}

export const HTTP_METHODS = [
  { method: 'GET', desc: '获取资源', safe: true, idempotent: true },
  { method: 'HEAD', desc: '获取响应头', safe: true, idempotent: true },
  { method: 'POST', desc: '创建资源', safe: false, idempotent: false },
  { method: 'PUT', desc: '完整更新资源', safe: false, idempotent: true },
  { method: 'PATCH', desc: '部分更新资源', safe: false, idempotent: false },
  { method: 'DELETE', desc: '删除资源', safe: false, idempotent: true },
  { method: 'OPTIONS', desc: '获取支持的请求方法', safe: true, idempotent: true },
]

function statusToItem(x: HttpStatusItem): RefItem {
  return {
    name: `${x.code} ${x.text}`,
    codeLabel: String(x.code),
    desc: x.desc,
    title: x.text,
  }
}

function methodToItem(m: (typeof HTTP_METHODS)[number]): RefItem {
  return {
    name: m.method,
    desc: m.desc,
    returns: `safe=${m.safe}, idempotent=${m.idempotent}`,
  }
}

export function queryHttpStatus(q: string): RefGroup[] {
  const groups: RefGroup[] = Object.entries(HTTP_STATUS).map(([cat, items]) => ({
    cat,
    items: items.map(statusToItem),
  }))
  groups.push({ cat: '方法', items: HTTP_METHODS.map(methodToItem) })
  return filterGroups(groups, q)
}

export function searchHttpStatus(q: string): string {
  return formatGroups(queryHttpStatus(q))
}
