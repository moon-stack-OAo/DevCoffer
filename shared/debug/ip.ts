/** IPv4 / CIDR 计算 */

function numToIp(n: number): string {
  n = n >>> 0
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join('.')
}

export function parseIpv4(ip: string): number[] | null {
  if (ip == null) return null
  const parts = String(ip).trim().split('.')
  if (parts.length !== 4) return null
  const nums: number[] = []
  for (let i = 0; i < 4; i++) {
    if (!/^\d+$/.test(parts[i]!)) return null
    const n = parseInt(parts[i]!, 10)
    if (isNaN(n) || n < 0 || n > 255) return null
    nums.push(n)
  }
  return nums
}

function ipIsPrivate(parts: number[]): boolean {
  const first = parts[0]!
  const second = parts[1]!
  return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168)
}

function ipIsLoopback(parts: number[]): boolean {
  return parts[0] === 127
}

export function formatIpLookup(input: string): string {
  const raw = String(input || '').trim()
  if (!raw) throw new Error('请输入 IP 或 CIDR，如 192.168.1.10/24')
  let ip = raw
  let mask = 32
  if (raw.includes('/')) {
    const [a, b] = raw.split('/')
    ip = a!.trim()
    mask = parseInt(b!, 10)
    if (isNaN(mask) || mask < 0 || mask > 32) throw new Error('CIDR 掩码须为 0-32')
  }
  const parts = parseIpv4(ip)
  if (!parts) throw new Error('无效 IPv4 地址')

  const first = parts[0]!
  let cls = 'A'
  if (first >= 1 && first <= 126) cls = 'A'
  else if (first >= 128 && first <= 191) cls = 'B'
  else if (first >= 192 && first <= 223) cls = 'C'
  else if (first >= 224 && first <= 239) cls = 'D (多播)'
  else if (first >= 240 && first <= 255) cls = 'E (保留)'
  else if (first === 0) cls = 'A'

  const hex = parts.map((p) => p.toString(16).toUpperCase().padStart(2, '0')).join('')
  const bin = parts.map((p) => p.toString(2).padStart(8, '0')).join('.')

  const ipNum = parts.reduce((acc, p) => (acc << 8) + p, 0) >>> 0
  const maskNum = mask === 0 ? 0 : mask === 32 ? 0xffffffff : (~(0xffffffff >>> mask) >>> 0)
  const netNum = (ipNum & maskNum) >>> 0
  const broadNum = (netNum | ~maskNum) >>> 0
  const firstUsable = mask < 31 ? netNum + 1 : netNum
  const lastUsable = mask < 31 ? broadNum - 1 : broadNum
  const total = Math.pow(2, 32 - mask)
  const usable = mask >= 31 ? 0 : Math.max(0, total - 2)

  return [
    `IP: ${parts.join('.')}`,
    `类别: ${cls}`,
    `私网: ${ipIsPrivate(parts) ? '是' : '否'}`,
    `回环: ${ipIsLoopback(parts) ? '是' : '否'}`,
    `Hex: ${hex}`,
    `Bin: ${bin}`,
    '',
    `CIDR: /${mask}`,
    `掩码: ${numToIp(maskNum)}`,
    `网络: ${numToIp(netNum)}`,
    `广播: ${numToIp(broadNum)}`,
    `可用首: ${numToIp(firstUsable >>> 0)}`,
    `可用末: ${numToIp(lastUsable >>> 0)}`,
    `主机数: ${total}（可用 ${usable}）`,
  ].join('\n')
}
