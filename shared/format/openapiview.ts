/** OpenAPI / Swagger 结构化摘要预览（支持 JSON / YAML） */
import { load as yamlLoad } from 'js-yaml'

const HTTP_METHODS = new Set([
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'head',
  'options',
  'trace',
])

export const OPENAPIVIEW_SAMPLE = `{
  "openapi": "3.0.3",
  "info": {
    "title": "Demo API",
    "version": "1.0.0",
    "description": "最小 OpenAPI 3 示例"
  },
  "servers": [
    { "url": "https://api.example.com/v1", "description": "生产" }
  ],
  "paths": {
    "/ping": {
      "get": {
        "summary": "健康检查",
        "responses": { "200": { "description": "ok" } }
      }
    },
    "/users/{id}": {
      "get": {
        "summary": "查询用户",
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "integer" } }
        ],
        "responses": { "200": { "description": "用户详情" } }
      }
    }
  },
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id": { "type": "integer" },
          "name": { "type": "string" }
        }
      }
    }
  }
}`

function parseOpenApiDoc(src: string): Record<string, any> {
  const raw = String(src ?? '').trim()
  if (!raw) throw new Error('请输入 OpenAPI / Swagger 文档（JSON 或 YAML）')

  let doc: unknown
  const looksJson = raw[0] === '{' || raw[0] === '['

  if (looksJson) {
    try {
      doc = JSON.parse(raw)
    } catch (e: any) {
      throw new Error('JSON 解析失败: ' + (e?.message || String(e)))
    }
  } else {
    try {
      doc = yamlLoad(raw)
    } catch (e: any) {
      // 也可能是坏 JSON 却不以 { 开头（极少见），给出更明确提示
      throw new Error('YAML 解析失败: ' + (e?.message || String(e)))
    }
  }

  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new Error('文档根节点必须是对象')
  }

  const root = doc as Record<string, any>
  if (typeof root.openapi !== 'string' && typeof root.swagger !== 'string') {
    throw new Error('未识别为 OpenAPI 3 或 Swagger 2（缺少 openapi / swagger 字段）')
  }
  return root
}

/** 生成结构化可读摘要（纯文本，非 Swagger UI） */
export function openApiSummary(src: string): string {
  const obj = parseOpenApiDoc(src)
  const lines: string[] = []

  lines.push('# OpenAPI 摘要预览')
  lines.push('')
  lines.push('## info')
  lines.push(`- title: ${obj.info?.title || '(无)'}`)
  lines.push(`- version: ${obj.info?.version || '(无)'}`)
  lines.push(`- description: ${obj.info?.description || '(无)'}`)
  lines.push(`- openapi/swagger: ${obj.openapi || obj.swagger || '(未知)'}`)
  lines.push('')

  lines.push('## servers')
  const servers = Array.isArray(obj.servers) ? obj.servers : []
  if (!servers.length) {
    // Swagger 2 host/basePath
    if (obj.host || obj.basePath) {
      lines.push(
        `- ${obj.schemes?.[0] || 'https'}://${obj.host || ''}${obj.basePath || ''}`,
      )
    } else {
      lines.push('- (无)')
    }
  } else {
    for (const s of servers.slice(0, 20)) {
      const url = s?.url || '(无 url)'
      const desc = s?.description ? ` — ${s.description}` : ''
      lines.push(`- ${url}${desc}`)
    }
    if (servers.length > 20) lines.push(`- … 另有 ${servers.length - 20} 个`)
  }
  lines.push('')

  lines.push('## paths')
  const paths = obj.paths || {}
  const pathKeys = Object.keys(paths)
  lines.push(`共 ${pathKeys.length} 条路径`)
  let shown = 0
  for (const p of pathKeys) {
    const item = paths[p] || {}
    const methods = Object.keys(item).filter((m) => HTTP_METHODS.has(m.toLowerCase()))
    for (const m of methods) {
      if (shown >= 80) break
      const op = item[m] || {}
      const summary = op.summary || op.operationId || ''
      lines.push(`- ${m.toUpperCase().padEnd(7)} ${p}${summary ? '  — ' + summary : ''}`)
      shown++
    }
    if (shown >= 80) break
  }
  if (pathKeys.length && shown >= 80) lines.push('- …（已截断）')
  if (!pathKeys.length) lines.push('- (无)')
  lines.push('')

  lines.push('## components / schemas')
  const schemas = obj.components?.schemas || obj.definitions || {}
  const schemaNames = Object.keys(schemas)
  if (!schemaNames.length) {
    lines.push('- (无)')
  } else {
    lines.push(`共 ${schemaNames.length} 个: ${schemaNames.slice(0, 40).join(', ')}`)
    if (schemaNames.length > 40) lines.push(`… 另有 ${schemaNames.length - 40} 个`)
  }
  lines.push('')

  const tags = Array.isArray(obj.tags) ? obj.tags.map((t: any) => t?.name || t).filter(Boolean) : []
  lines.push('## tags')
  lines.push(tags.length ? tags.join(', ') : '(无)')

  return lines.join('\n')
}
