/** 数据脱敏（手机 / 身份证 / 邮箱等） */

type Rule = {
  name: string
  re: RegExp
  replace: (...args: any[]) => string
}

/** 标签/停用词：避免「联系人」「手机」等被当成中文姓名 */
const NAME_STOPWORDS = new Set([
  '联系人',
  '手机',
  '邮箱',
  '身份证',
  '银行卡',
  '地址',
  '姓名',
  '名字',
  '电话',
  '用户',
  '公司',
  '部门',
  '真实姓名',
  '客户',
  '收件人',
  '发件人',
])

export const DS_RULES: Record<string, Rule> = {
  phone: {
    name: '手机号',
    re: /(?<!\d)(1[3-9]\d)(\d{4})(\d{4})(?!\d)/g,
    replace: (_m: string, a: string, _b: string, c: string) => a + '****' + c,
  },
  idcard: {
    name: '身份证',
    re: /(?<!\d)(\d{6})(\d{8})(\d{3}[\dXx])(?!\d)/g,
    replace: (_m: string, a: string, _b: string, c: string) => a + '********' + c,
  },
  bank: {
    name: '银行卡',
    re: /(?<!\d)(\d{4})(\d{8,12})(\d{4})(?!\d)/g,
    replace: (_m: string, a: string, mid: string, c: string) => a + mid.replace(/\d/g, '*') + c,
  },
  email: {
    name: '邮箱',
    re: /([A-Za-z0-9._%+-]{1,64})@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g,
    replace: (_m: string, user: string, domain: string) => {
      if (user.length <= 1) return '*@' + domain
      if (user.length === 2) return user[0] + '*@' + domain
      return user[0] + '***' + user[user.length - 1] + '@' + domain
    },
  },
  ipv4: {
    name: 'IPv4',
    re: /\b((?:\d{1,3}\.){3})(\d{1,3})\b/g,
    replace: (_m: string, prefix: string) => prefix + '*',
  },
  name: {
    name: '中文姓名',
    // 独立 2～4 字汉字串；停用词不替换；前后不可再接汉字
    re: /(?<![\u4e00-\u9fff])([\u4e00-\u9fff]{2,4})(?![\u4e00-\u9fff])/g,
    replace: (m: string) => {
      if (NAME_STOPWORDS.has(m)) return m
      return m[0] + '*'.repeat(m.length - 1)
    },
  },
}

export type DesensitizeOptions = {
  types?: string[]
  mode?: 'text' | 'json'
  jsonFields?: string[]
}

export function desensitizeText(
  text: string,
  options: DesensitizeOptions = {},
): { text: string; hits: Record<string, number> } {
  const types = options.types && options.types.length ? options.types : Object.keys(DS_RULES)
  const mode = options.mode || 'text'
  const hits: Record<string, number> = {}
  types.forEach((t) => {
    hits[t] = 0
  })

  if (text == null || text === '') {
    return { text: text == null ? '' : text, hits }
  }

  if (mode === 'json') {
    return desensitizeJson(String(text), types, options.jsonFields || [], hits)
  }

  let out = String(text)
  types.forEach((type) => {
    const rule = DS_RULES[type]
    if (!rule) return
    rule.re.lastIndex = 0
    out = out.replace(rule.re, function (...args: any[]) {
      const next = rule.replace.apply(null, args as any)
      if (next !== args[0]) hits[type] = (hits[type] || 0) + 1
      return next
    })
  })
  return { text: out, hits }
}

function desensitizeJson(
  raw: string,
  types: string[],
  fields: string[],
  hits: Record<string, number>,
) {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return desensitizeText(raw, { types, mode: 'text' })
  }

  const fieldSet: Record<string, boolean> = {}
  fields.forEach((f) => {
    if (f) fieldSet[String(f).trim().toLowerCase()] = true
  })
  const useFieldFilter = Object.keys(fieldSet).length > 0

  function maskString(s: string): string {
    let out = s
    types.forEach((type) => {
      const rule = DS_RULES[type]
      if (!rule) return
      rule.re.lastIndex = 0
      out = out.replace(rule.re, function (...args: any[]) {
        const next = rule.replace.apply(null, args as any)
        if (next !== args[0]) hits[type] = (hits[type] || 0) + 1
        return next
      })
    })
    return out
  }

  function walk(node: any, key: string | null): any {
    if (node === null || node === undefined) return node
    if (typeof node === 'string') {
      if (useFieldFilter) {
        const k = key ? String(key).toLowerCase() : ''
        if (!fieldSet[k]) return node
      }
      return maskString(node)
    }
    if (typeof node === 'number' || typeof node === 'boolean') {
      if (useFieldFilter) {
        const k = key ? String(key).toLowerCase() : ''
        if (!fieldSet[k]) return node
      }
      const s = String(node)
      const masked = maskString(s)
      return masked === s ? node : masked
    }
    if (Array.isArray(node)) return node.map((item) => walk(item, key))
    if (typeof node === 'object') {
      const o: Record<string, any> = {}
      Object.keys(node).forEach((k) => {
        o[k] = walk(node[k], k)
      })
      return o
    }
    return node
  }

  return { text: JSON.stringify(walk(data, null), null, 2), hits }
}
