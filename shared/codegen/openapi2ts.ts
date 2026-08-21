import { load as yamlLoad } from 'js-yaml'

export type ParseOpenApiResult =
  | { ok: true; doc: Record<string, any>; format: 'json' | 'yaml' }
  | { ok: false; error: string; doc?: undefined; format?: undefined }

export function parseOpenApi(text: string): ParseOpenApiResult {
  const raw = String(text == null ? '' : text).trim()
  if (!raw) {
    return { ok: false, error: '请输入 OpenAPI 文档内容' }
  }

  let doc: unknown = null
  let format: 'json' | 'yaml' | null = null

  if (raw[0] === '{' || raw[0] === '[') {
    try {
      doc = JSON.parse(raw)
      format = 'json'
    } catch (e: any) {
      return { ok: false, error: 'JSON 解析失败: ' + (e?.message || e) }
    }
  } else {
    try {
      doc = yamlLoad(raw)
      format = 'yaml'
    } catch (e: any) {
      return { ok: false, error: 'YAML 解析失败: ' + (e?.message || e) }
    }
  }

  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    return { ok: false, error: '文档根节点必须是对象' }
  }

  const root = doc as Record<string, any>
  const isOas3 = typeof root.openapi === 'string'
  const isSwagger2 = typeof root.swagger === 'string'
  if (!isOas3 && !isSwagger2) {
    return {
      ok: false,
      error: '未识别为 OpenAPI 3 或 Swagger 2（缺少 openapi / swagger 字段）',
    }
  }

  return { ok: true, doc: root, format }
}

export function o2tSafeIdent(name: string): string {
  let s = String(name || '')
    .replace(/[^A-Za-z0-9_$]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  if (!s) s = 'Unnamed'
  if (/^\d/.test(s)) s = '_' + s
  return s
}

export function o2tFnName(method: string, path: string, operationId?: string): string {
  if (operationId && String(operationId).trim()) {
    return o2tSafeIdent(String(operationId).trim())
  }
  const parts = String(path || '')
    .split('/')
    .filter(Boolean)
    .map((p) => {
      if (p.startsWith('{') && p.endsWith('}')) {
        return (
          'By' +
          o2tSafeIdent(p.slice(1, -1)).replace(/^\w/, (c) => c.toUpperCase())
        )
      }
      return o2tSafeIdent(p).replace(/^\w/, (c) => c.toUpperCase())
    })
  const m = String(method || 'get').toLowerCase()
  const base = m + (parts.length ? parts.join('') : 'Root')
  return o2tSafeIdent(base)
}

function o2tRefName(ref: string): string | null {
  if (!ref || typeof ref !== 'string') return null
  const m = ref.match(/#\/components\/schemas\/([^/]+)$/)
  if (m) return o2tSafeIdent(m[1]!)
  const m2 = ref.match(/#\/definitions\/([^/]+)$/)
  if (m2) return o2tSafeIdent(m2[1]!)
  return null
}

export function o2tSchemaToTs(schema: any, ctx?: unknown): string {
  if (!schema || typeof schema !== 'object') return 'unknown'
  if (schema.$ref) {
    return o2tRefName(schema.$ref) || 'unknown'
  }
  if (Array.isArray(schema.enum) && schema.enum.length) {
    return schema.enum
      .map((v: unknown) => (typeof v === 'string' ? JSON.stringify(v) : String(v)))
      .join(' | ')
  }
  if (schema.allOf && Array.isArray(schema.allOf)) {
    const parts = schema.allOf.map((s: any) => o2tSchemaToTs(s, ctx))
    return parts.filter(Boolean).join(' & ') || 'unknown'
  }
  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    const parts = schema.oneOf.map((s: any) => o2tSchemaToTs(s, ctx))
    return parts.filter(Boolean).join(' | ') || 'unknown'
  }
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    const parts = schema.anyOf.map((s: any) => o2tSchemaToTs(s, ctx))
    return parts.filter(Boolean).join(' | ') || 'unknown'
  }

  const t = schema.type
  if (Array.isArray(t)) {
    return t
      .map((x: string) => o2tSchemaToTs(Object.assign({}, schema, { type: x }), ctx))
      .join(' | ')
  }

  switch (t) {
    case 'string':
      return 'string'
    case 'integer':
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'null':
      return 'null'
    case 'array':
      return o2tSchemaToTs(schema.items || {}, ctx) + '[]'
    case 'object':
    default:
      if (schema.properties && typeof schema.properties === 'object') {
        const req: string[] = Array.isArray(schema.required) ? schema.required : []
        const keys = Object.keys(schema.properties)
        if (!keys.length) {
          if (schema.additionalProperties) {
            const ap =
              schema.additionalProperties === true
                ? 'unknown'
                : o2tSchemaToTs(schema.additionalProperties, ctx)
            return 'Record<string, ' + ap + '>'
          }
          return 'Record<string, unknown>'
        }
        const fields = keys.map((k) => {
          const opt = req.indexOf(k) >= 0 ? '' : '?'
          const safe = /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)
          return '  ' + safe + opt + ': ' + o2tSchemaToTs(schema.properties[k], ctx) + ';'
        })
        return '{\n' + fields.join('\n') + '\n}'
      }
      if (schema.additionalProperties) {
        const ap =
          schema.additionalProperties === true
            ? 'unknown'
            : o2tSchemaToTs(schema.additionalProperties, ctx)
        return 'Record<string, ' + ap + '>'
      }
      if (!t) return 'unknown'
      return 'Record<string, unknown>'
  }
}

function o2tGenerateInterfaces(doc: Record<string, any>): string[] {
  const schemas =
    (doc.components && doc.components.schemas) || doc.definitions || {}
  const names = Object.keys(schemas)
  const lines: string[] = []
  names.forEach((name) => {
    const safe = o2tSafeIdent(name)
    const schema = schemas[name] || {}
    const ts = o2tSchemaToTs(schema)
    if (ts.startsWith('{')) {
      lines.push('export interface ' + safe + ' ' + ts)
    } else {
      lines.push('export type ' + safe + ' = ' + ts + ';')
    }
    lines.push('')
  })
  return lines
}

function o2tRequestBodySchema(op: any): any | null {
  if (!op || typeof op !== 'object') return null
  if (op.requestBody && op.requestBody.content) {
    const content = op.requestBody.content
    const json =
      content['application/json'] ||
      content['application/*+json'] ||
      content['*/*']
    if (json && json.schema) return json.schema
    const keys = Object.keys(content)
    for (let i = 0; i < keys.length; i++) {
      const c = content[keys[i]!]
      if (c && c.schema) return c.schema
    }
  }
  if (Array.isArray(op.parameters)) {
    for (let i = 0; i < op.parameters.length; i++) {
      const p = op.parameters[i]
      if (p && p.in === 'body' && p.schema) return p.schema
    }
  }
  return null
}

function o2tResponseSchema(op: any): any | null {
  if (!op || !op.responses) return null
  const responses = op.responses
  const prefer = ['200', '201', '202', '204', 'default']
  for (let i = 0; i < prefer.length; i++) {
    const r = responses[prefer[i]!]
    if (!r) continue
    if (r.content) {
      const json = r.content['application/json'] || r.content['*/*']
      if (json && json.schema) return json.schema
      const keys = Object.keys(r.content)
      for (let j = 0; j < keys.length; j++) {
        const c = r.content[keys[j]!]
        if (c && c.schema) return c.schema
      }
    }
    if (r.schema) return r.schema
  }
  const codes = Object.keys(responses)
  for (let i = 0; i < codes.length; i++) {
    const r = responses[codes[i]!]
    if (r && r.content) {
      const keys = Object.keys(r.content)
      for (let j = 0; j < keys.length; j++) {
        const c = r.content[keys[j]!]
        if (c && c.schema) return c.schema
      }
    }
    if (r && r.schema) return r.schema
  }
  return null
}

function o2tCollectParams(pathItem: any, op: any): any[] {
  const list: any[] = []
  const seen: Record<string, boolean> = {}
  function add(arr: any) {
    if (!Array.isArray(arr)) return
    arr.forEach((p: any) => {
      if (!p || typeof p !== 'object' || !p.name) return
      if (p.$ref) return
      const key = (p.in || '') + ':' + p.name
      if (seen[key]) return
      seen[key] = true
      list.push(p)
    })
  }
  add(pathItem && pathItem.parameters)
  add(op && op.parameters)
  return list
}

export function generateTsClient(
  doc: Record<string, any>,
  options?: { baseUrl?: string },
): string {
  const opts = options || {}
  let baseUrl = opts.baseUrl != null ? String(opts.baseUrl) : ''
  if (!baseUrl && doc.servers && doc.servers[0] && doc.servers[0].url) {
    baseUrl = String(doc.servers[0].url)
  }
  if (!baseUrl && doc.host) {
    const scheme =
      Array.isArray(doc.schemes) && doc.schemes[0] ? doc.schemes[0] : 'https'
    baseUrl = scheme + '://' + doc.host + (doc.basePath || '')
  }
  if (!baseUrl) baseUrl = ''

  const lines: string[] = []
  const title = (doc.info && doc.info.title) || 'API'
  const version = (doc.info && doc.info.version) || ''
  lines.push('/**')
  lines.push(' * Auto-generated TypeScript client')
  lines.push(' * ' + title + (version ? ' v' + version : ''))
  lines.push(' * Do not edit manually.')
  lines.push(' */')
  lines.push('')
  lines.push('export type FetchLike = typeof fetch;')
  lines.push('')
  lines.push('export interface ClientOptions {')
  lines.push('  baseUrl?: string;')
  lines.push('  fetch?: FetchLike;')
  lines.push('  headers?: Record<string, string>;')
  lines.push('}')
  lines.push('')
  lines.push('export class ApiError extends Error {')
  lines.push('  status: number;')
  lines.push('  body: unknown;')
  lines.push('  constructor(message: string, status: number, body: unknown) {')
  lines.push('    super(message);')
  lines.push('    this.name = "ApiError";')
  lines.push('    this.status = status;')
  lines.push('    this.body = body;')
  lines.push('  }')
  lines.push('}')
  lines.push('')

  const ifaceLines = o2tGenerateInterfaces(doc)
  if (ifaceLines.length) {
    lines.push('// ---------- Schemas ----------')
    lines.push('')
    ifaceLines.forEach((l) => {
      lines.push(l)
    })
  }

  lines.push('// ---------- Client ----------')
  lines.push('')
  lines.push('const DEFAULT_BASE_URL = ' + JSON.stringify(baseUrl) + ';')
  lines.push('')
  lines.push('export function createClient(options: ClientOptions = {}) {')
  lines.push('  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\\/$/, "");')
  lines.push('  const fetchFn: FetchLike = options.fetch ?? fetch;')
  lines.push('  const defaultHeaders: Record<string, string> = {')
  lines.push('    Accept: "application/json",')
  lines.push('    ...(options.headers || {}),')
  lines.push('  };')
  lines.push('')
  lines.push('  async function request<T>(')
  lines.push('    method: string,')
  lines.push('    path: string,')
  lines.push('    init?: {')
  lines.push('      query?: Record<string, string | number | boolean | undefined | null>;')
  lines.push('      body?: unknown;')
  lines.push('      headers?: Record<string, string>;')
  lines.push('      pathParams?: Record<string, string | number>;')
  lines.push('    },')
  lines.push('  ): Promise<T> {')
  lines.push('    let urlPath = path;')
  lines.push('    if (init?.pathParams) {')
  lines.push('      Object.keys(init.pathParams).forEach((k) => {')
  lines.push(
    '        urlPath = urlPath.replace(new RegExp("{" + k + "}", "g"), encodeURIComponent(String(init.pathParams![k])));',
  )
  lines.push('      });')
  lines.push('    }')
  lines.push('    const qs = new URLSearchParams();')
  lines.push('    if (init?.query) {')
  lines.push('      Object.keys(init.query).forEach((k) => {')
  lines.push('        const v = init.query![k];')
  lines.push('        if (v === undefined || v === null) return;')
  lines.push('        qs.set(k, String(v));')
  lines.push('      });')
  lines.push('    }')
  lines.push('    const q = qs.toString();')
  lines.push('    const url = baseUrl + urlPath + (q ? "?" + q : "");')
  lines.push('    const headers: Record<string, string> = { ...defaultHeaders, ...(init?.headers || {}) };')
  lines.push('    let body: string | undefined;')
  lines.push('    if (init?.body !== undefined && init?.body !== null) {')
  lines.push('      headers["Content-Type"] = headers["Content-Type"] || "application/json";')
  lines.push('      body = typeof init.body === "string" ? init.body : JSON.stringify(init.body);')
  lines.push('    }')
  lines.push('    const res = await fetchFn(url, { method, headers, body });')
  lines.push('    const text = await res.text();')
  lines.push('    let data: unknown = undefined;')
  lines.push('    if (text) {')
  lines.push('      try { data = JSON.parse(text); } catch { data = text; }')
  lines.push('    }')
  lines.push('    if (!res.ok) {')
  lines.push('      throw new ApiError(res.statusText || "HTTP " + res.status, res.status, data);')
  lines.push('    }')
  lines.push('    return data as T;')
  lines.push('  }')
  lines.push('')

  const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']
  const paths = doc.paths && typeof doc.paths === 'object' ? doc.paths : {}
  const pathKeys = Object.keys(paths)
  const usedNames: Record<string, boolean> = {}

  pathKeys.forEach((path) => {
    const pathItem = paths[path] || {}
    methods.forEach((method) => {
      const op = pathItem[method]
      if (!op || typeof op !== 'object') return

      let fn = o2tFnName(method, path, op.operationId)
      if (usedNames[fn]) {
        let n = 2
        while (usedNames[fn + n]) n++
        fn = fn + n
      }
      usedNames[fn] = true

      const params = o2tCollectParams(pathItem, op)
      const pathParams = params.filter((p) => p.in === 'path')
      const queryParams = params.filter((p) => p.in === 'query')
      const headerParams = params.filter((p) => p.in === 'header')
      const bodySchema = o2tRequestBodySchema(op)
      const respSchema = o2tResponseSchema(op)
      const respTs = respSchema ? o2tSchemaToTs(respSchema) : 'unknown'
      const bodyTs = bodySchema ? o2tSchemaToTs(bodySchema) : null

      const argParts: string[] = []
      pathParams.forEach((p) => {
        const t =
          p.schema && p.schema.type === 'integer'
            ? 'number'
            : p.schema && p.schema.type === 'number'
              ? 'number'
              : p.schema && p.schema.type === 'boolean'
                ? 'boolean'
                : p.type === 'integer' || p.type === 'number'
                  ? 'number'
                  : p.type === 'boolean'
                    ? 'boolean'
                    : 'string'
        argParts.push(o2tSafeIdent(p.name) + ': ' + t)
      })
      if (queryParams.length) {
        const fields = queryParams.map((p) => {
          const opt = p.required ? '' : '?'
          const t = (p.schema && p.schema.type) || p.type || 'string'
          const ts =
            t === 'integer' || t === 'number'
              ? 'number'
              : t === 'boolean'
                ? 'boolean'
                : 'string'
          return o2tSafeIdent(p.name) + opt + ': ' + ts
        })
        argParts.push('query: { ' + fields.join('; ') + ' }')
      }
      if (bodyTs) {
        const required =
          op.requestBody && op.requestBody.required !== false ? true : !!bodySchema
        argParts.push('body' + (required ? '' : '?') + ': ' + bodyTs)
      }
      if (headerParams.length) {
        const fields = headerParams.map((p) => {
          const opt = p.required ? '' : '?'
          return o2tSafeIdent(p.name) + opt + ': string'
        })
        argParts.push('headers?: { ' + fields.join('; ') + ' }')
      }

      const summary = op.summary || op.description || method.toUpperCase() + ' ' + path
      lines.push(
        '  /** ' + String(summary).replace(/\*\//g, '* /').split('\n')[0] + ' */',
      )
      lines.push(
        '  async function ' + fn + '(' + argParts.join(', ') + '): Promise<' + respTs + '> {',
      )

      if (pathParams.length) {
        lines.push('    const pathParams = {')
        pathParams.forEach((p) => {
          const id = o2tSafeIdent(p.name)
          lines.push('      ' + JSON.stringify(p.name) + ': ' + id + ',')
        })
        lines.push('    };')
      }

      if (queryParams.length) {
        lines.push(
          '    const queryObj: Record<string, string | number | boolean | undefined | null> = {',
        )
        queryParams.forEach((p) => {
          const id = o2tSafeIdent(p.name)
          lines.push('      ' + JSON.stringify(p.name) + ': query.' + id + ',')
        })
        lines.push('    };')
      }

      if (headerParams.length) {
        lines.push('    const hdrs: Record<string, string> = {};')
        headerParams.forEach((p) => {
          const id = o2tSafeIdent(p.name)
          if (p.required) {
            lines.push(
              '    if (headers && headers.' +
                id +
                ' != null) hdrs[' +
                JSON.stringify(p.name) +
                '] = headers.' +
                id +
                ';',
            )
          } else {
            lines.push(
              '    if (headers?.' +
                id +
                ' != null) hdrs[' +
                JSON.stringify(p.name) +
                '] = headers.' +
                id +
                ';',
            )
          }
        })
      }

      const callArgs = [JSON.stringify(method.toUpperCase()), JSON.stringify(path)]
      const initParts: string[] = []
      if (pathParams.length) initParts.push('pathParams')
      if (queryParams.length) initParts.push('query: queryObj')
      if (bodyTs) initParts.push('body')
      if (headerParams.length) initParts.push('headers: hdrs')
      if (initParts.length) {
        lines.push(
          '    return request<' +
            respTs +
            '>(' +
            callArgs.join(', ') +
            ', { ' +
            initParts.join(', ') +
            ' });',
        )
      } else {
        lines.push('    return request<' + respTs + '>(' + callArgs.join(', ') + ');')
      }
      lines.push('  }')
      lines.push('')
    })
  })

  const fnNames = Object.keys(usedNames)
  lines.push('  return {')
  lines.push('    request,')
  fnNames.forEach((n) => {
    lines.push('    ' + n + ',')
  })
  lines.push('  };')
  lines.push('}')
  lines.push('')
  lines.push('export type ApiClient = ReturnType<typeof createClient>;')
  lines.push('')

  return lines.join('\n')
}

export function openApiToTs(src: string, options?: { baseUrl?: string }): string {
  const parsed = parseOpenApi(src)
  if (!parsed.ok) throw new Error(parsed.error)
  return generateTsClient(parsed.doc, options)
}

export const O2T_SAMPLE = JSON.stringify(
  {
    openapi: '3.0.3',
    info: { title: 'Petstore Mini', version: '1.0.0' },
    servers: [{ url: 'https://petstore.example.com/api' }],
    paths: {
      '/pets': {
        get: {
          operationId: 'listPets',
          summary: 'List all pets',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': {
              description: 'A paged array of pets',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Pet' },
                  },
                },
              },
            },
          },
        },
        post: {
          operationId: 'createPet',
          summary: 'Create a pet',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NewPet' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Pet' },
                },
              },
            },
          },
        },
      },
      '/pets/{petId}': {
        get: {
          operationId: 'getPetById',
          summary: 'Info for a specific pet',
          parameters: [
            {
              name: 'petId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Expected response',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Pet' },
                },
              },
            },
          },
        },
        delete: {
          operationId: 'deletePet',
          summary: 'Delete a pet',
          parameters: [
            {
              name: 'petId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '204': { description: 'Pet deleted' },
          },
        },
      },
    },
    components: {
      schemas: {
        Pet: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'integer', format: 'int64' },
            name: { type: 'string' },
            tag: { type: 'string' },
          },
        },
        NewPet: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            tag: { type: 'string' },
          },
        },
      },
    },
  },
  null,
  2,
)
