/** UA 解析：预设与结果格式化 */

export const UA_PRESETS: Record<string, { label: string; ua: string }> = {
  chrome: {
    label: 'Chrome (Windows)',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  firefox: {
    label: 'Firefox (Windows)',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  },
  safari: {
    label: 'Safari (macOS)',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  },
  edge: {
    label: 'Edge (Windows)',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  },
  iphone: {
    label: 'iPhone Safari',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  },
  android: {
    label: 'Android Chrome',
    ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  },
  googlebot: {
    label: 'Googlebot',
    ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  },
  wechat: {
    label: '微信内置',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.45(0x18002d39) NetType/WIFI Language/zh_CN',
  },
  dingtalk: {
    label: '钉钉',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 DingTalk/7.6.20 Language/zh-Hans CN',
  },
  feishu: {
    label: '飞书',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Lark/7.30.6 ChannelName/IPA MoEngagePlugin/CHANNELID/IOS',
  },
}

export interface UaParseResultLike {
  ua?: string
  browser?: { name?: string; version?: string; major?: string; type?: string }
  os?: { name?: string; version?: string }
  device?: { type?: string; vendor?: string; model?: string }
  engine?: { name?: string; version?: string }
  cpu?: { architecture?: string }
}

export function formatUaParse(result: UaParseResultLike, rawUa = ''): string {
  const lines: string[] = []
  lines.push('=== UA 原文 ===')
  lines.push(result.ua || rawUa || '(空)')
  lines.push('')
  lines.push('=== 浏览器 ===')
  const b = result.browser || {}
  lines.push('名称     : ' + (b.name || '(未知)'))
  lines.push('版本     : ' + (b.version || '(未知)'))
  lines.push('主版本   : ' + (b.major || '(未知)'))
  if (b.type) lines.push('类型     : ' + b.type)
  lines.push('')
  lines.push('=== 操作系统 ===')
  const os = result.os || {}
  lines.push('名称     : ' + (os.name || '(未知)'))
  lines.push('版本     : ' + (os.version || '(未知)'))
  lines.push('')
  lines.push('=== 设备 ===')
  const d = result.device || {}
  lines.push('类型     : ' + (d.type || '(未知, 默认 desktop)'))
  lines.push('厂商     : ' + (d.vendor || '(未知)'))
  lines.push('型号     : ' + (d.model || '(未知)'))
  lines.push('')
  lines.push('=== 渲染引擎 ===')
  const eng = result.engine || {}
  lines.push('名称     : ' + (eng.name || '(未知)'))
  lines.push('版本     : ' + (eng.version || '(未知)'))
  lines.push('')
  lines.push('=== CPU 架构 ===')
  const cpu = result.cpu || {}
  lines.push('架构     : ' + (cpu.architecture || '(未知)'))
  return lines.join('\n')
}
