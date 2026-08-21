/** 简单 mock 数据：姓名/手机/邮箱等 */

const SURNAMES =
  '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳丰鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴宋茅庞熊纪舒屈项祝董阮蓝闽席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田樊胡凌霍虞万支柯管卢莫经房裘缪解应宗丁宣邓郁单杭洪包诸左石崔吉钮龚程邢滑裴陆荣翁荀羊惠甄曲家封芮储靳段富巫乌焦巴弓牧谷车侯全班仰秋仲伊宫宁仇栾暴甘厉祖武符刘景詹束龙叶幸司韶黎薄印宿白怀蒲从鄂索咸籍赖卓蔺屠蒙池乔阴胥能苍双闻莘党翟谭贡劳姬申扶冉宰郦雍桑桂濮牛寿通边扈燕冀浦尚农温别庄晏柴瞿阎充慕连茹习宦艾鱼容向古易慎戈廖庾终暨居衡步都耿满弘匡国文寇广禄阙东欧利蔚越隆师巩聂晁勾敖融冷辛简饶空曾沙养鞠须丰巢关蒯相查后荆红游竺权逯盖益桓'
const GIVEN =
  '明华军强杰飞斌丽敏芳静霞秀娟英玲萍红莲云琼桂香兰凤玉花荷洁梅琴珍艳淑贞芝瑞琳媛婷岚瑶怡萱彤倩妍颖钰霖琪思雨薇欣玥珂琦慧'
const EMAIL_DOMAINS = [
  'gmail.com',
  'qq.com',
  '163.com',
  '126.com',
  'outlook.com',
  'foxmail.com',
  'aliyun.com',
  'sina.com',
]
const CITIES = [
  '北京市',
  '上海市',
  '广州市',
  '深圳市',
  '杭州市',
  '成都市',
  '武汉市',
  '南京市',
  '西安市',
  '重庆市',
  '天津市',
  '苏州市',
  '长沙市',
  '郑州市',
  '东莞市',
  '青岛市',
  '沈阳市',
  '宁波市',
  '昆明市',
  '大连市',
]

export const MOCK_FIELDS = [
  { key: 'name', label: '姓名' },
  { key: 'phone', label: '手机' },
  { key: 'email', label: '邮箱' },
  { key: 'city', label: '城市' },
  { key: 'idCard', label: '身份证' },
] as const

export type MockFieldKey = (typeof MOCK_FIELDS)[number]['key']

export const MOCK_FIELD_KEYS: MockFieldKey[] = MOCK_FIELDS.map((f) => f.key)

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function randomLocal(len: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[randInt(0, chars.length - 1)]
  return s
}

export function mockName(): string {
  const surname = pick(Array.from(SURNAMES))
  const givenLen = Math.random() > 0.4 ? 2 : 1
  let given = ''
  const g = Array.from(GIVEN)
  for (let i = 0; i < givenLen; i++) given += pick(g)
  return surname + given
}

export function mockPhone(): string {
  const prefixes = [
    '130', '131', '132', '133', '134', '135', '136', '137', '138', '139',
    '150', '151', '152', '153', '155', '156', '157', '158', '159',
    '170', '171', '173', '175', '176', '177', '178',
    '180', '181', '182', '183', '184', '185', '186', '187', '188', '189', '198', '199',
  ]
  let num = ''
  for (let i = 0; i < 8; i++) num += randInt(0, 9)
  return pick(prefixes) + num
}

export function mockEmail(name?: string): string {
  const n = (name || mockName()).replace(/\s/g, '')
  let fromName = n.toLowerCase().replace(/[^a-z0-9]/gi, '')
  if (fromName.length < 4) {
    fromName = 'user' + randomLocal(randInt(4, 8))
  } else {
    fromName = fromName + randInt(10, 99)
  }
  const local = Math.random() > 0.5 ? fromName : 'user' + randInt(1000, 9999)
  return local + '@' + pick(EMAIL_DOMAINS)
}

export function mockIdCardLike(): string {
  // 仅格式样例，非真实身份证算法
  const area = String(randInt(110101, 659001))
  const y = randInt(1970, 2005)
  const m = String(randInt(1, 12)).padStart(2, '0')
  const d = String(randInt(1, 28)).padStart(2, '0')
  const seq = String(randInt(1, 999)).padStart(3, '0')
  return area + y + m + d + seq + 'X'
}

export type MockRow = Partial<Record<MockFieldKey, string>> & {
  name?: string
  phone?: string
  email?: string
  city?: string
  idCard?: string
}

export function clampMockCount(count: number): { n: number; clamped: boolean; tip?: string } {
  const raw = Number(count)
  if (!isFinite(raw) || raw <= 0) {
    return { n: 1, clamped: true, tip: '条数无效，已按 1 条生成（有效范围 1～500）' }
  }
  const rounded = Math.round(raw)
  if (rounded > 500) {
    return { n: 500, clamped: true, tip: '条数超过上限，已按 500 条生成（有效范围 1～500）' }
  }
  if (rounded < 1) {
    return { n: 1, clamped: true, tip: '条数过小，已按 1 条生成（有效范围 1～500）' }
  }
  return { n: rounded, clamped: false }
}

function normalizeFields(fields?: MockFieldKey[]): MockFieldKey[] {
  const list = (fields || []).filter((k) => MOCK_FIELD_KEYS.includes(k))
  return list.length ? list : [...MOCK_FIELD_KEYS]
}

export function generateMockRows(count: number, fields?: MockFieldKey[]): MockRow[] {
  const { n } = clampMockCount(count)
  const keys = normalizeFields(fields)
  const rows: MockRow[] = []
  for (let i = 0; i < n; i++) {
    const name = mockName()
    const full: Record<MockFieldKey, string> = {
      name,
      phone: mockPhone(),
      email: mockEmail(name),
      city: pick(CITIES),
      idCard: mockIdCardLike(),
    }
    const row: MockRow = {}
    for (const k of keys) row[k] = full[k]
    rows.push(row)
  }
  return rows
}

export function mockToJson(count: number, fields?: MockFieldKey[]): string {
  return JSON.stringify(generateMockRows(count, fields), null, 2)
}

export function mockToCsv(count: number, fields?: MockFieldKey[]): string {
  const keys = normalizeFields(fields)
  const rows = generateMockRows(count, keys)
  const lines = [keys.join(',')]
  rows.forEach((r) => lines.push(keys.map((k) => r[k] ?? '').join(',')))
  return lines.join('\n')
}
