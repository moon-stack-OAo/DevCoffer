/** 摩斯电码（ITU + 扩展符号；可选中文电码：汉字 → 四位电报码 → 数字摩斯） */

const MORSE_TABLE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', _: '..--.-',
  '"': '.-..-.', $: '...-..-', '@': '.--.-.',
  '#': '.-.-..', '%': '..-..-', '*': '-.----', '\\': '.-....',
  '[': '..---.', ']': '..----', '{': '--.-..', '}': '--.-.-',
  '|': '--.--.', '~': '--.---', '<': '---.-.', '>': '---.--',
  '^': '.-...-', '`': '...---',
}

const MORSE_REVERSE: Record<string, string> = Object.create(null)
for (const [ch, code] of Object.entries(MORSE_TABLE)) {
  MORSE_REVERSE[code] = ch
}

/** 中文电码：字→四位码 / 四位码→字（懒加载） */
let ctcCharToCode: Record<string, string> | null = null
let ctcCodeToChar: Record<string, string> | null = null
let ctcLoadPromise: Promise<Record<string, string>> | null = null

export function isCjkChar(ch: string): boolean {
  if (!ch) return false
  const cp = ch.codePointAt(0)!
  return (
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x20000 && cp <= 0x2a6df)
  )
}

export function setCtcTable(charToCode: Record<string, string> | null | undefined): void {
  ctcCharToCode = charToCode ? { ...charToCode } : {}
  ctcCodeToChar = {}
  for (const ch of Object.keys(ctcCharToCode)) {
    const code = String(ctcCharToCode[ch]).padStart(4, '0')
    ctcCharToCode[ch] = code
    if (!ctcCodeToChar[code]) ctcCodeToChar[code] = ch
  }
}

export function hasCtcTable(): boolean {
  return !!ctcCharToCode
}

export async function loadCtcTable(): Promise<Record<string, string>> {
  if (ctcCharToCode) return ctcCharToCode
  if (ctcLoadPromise) return ctcLoadPromise

  ctcLoadPromise = (async () => {
    try {
      const res = await fetch('/lib/ctc-cn.json')
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = (await res.json()) as Record<string, string>
      setCtcTable(data)
      return ctcCharToCode!
    } catch (e) {
      ctcLoadPromise = null
      throw new Error('加载中文电码表失败: ' + (e instanceof Error ? e.message : String(e)))
    }
  })()
  return ctcLoadPromise
}

function applyDotDash(code: string, dot: string, dash: string): string {
  if (dot === '.' && dash === '-') return code
  return code.split('.').join(dot).split('-').join(dash)
}

const PUNCT_NORMALIZE: Record<string, string> = {
  '，': ',', '。': '.', '！': '!', '？': '?', '：': ':', '；': ';',
  '（': '(', '）': ')', '【': '(', '】': ')', '「': '"', '」': '"',
  '『': '"', '』': '"', '“': '"', '”': '"', '‘': "'", '’': "'",
  '、': ',', '…': '.', '—': '-', '－': '-', '＠': '@', '＆': '&',
  '／': '/', '＝': '=', '＋': '+', '＄': '$', '＿': '_', '＃': '#',
  '％': '%', '＊': '*', '＼': '\\', '［': '[', '］': ']', '｛': '{',
  '｝': '}', '｜': '|', '～': '~', '＜': '<', '＞': '>', '＾': '^',
  '｀': '`',
  '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
  '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
}

export function normalizeMorseChar(ch: string): string {
  if (PUNCT_NORMALIZE[ch] != null) return PUNCT_NORMALIZE[ch]!
  const cp = ch.codePointAt(0)!
  if (cp >= 0xff21 && cp <= 0xff3a) return String.fromCharCode(cp - 0xff21 + 65)
  if (cp >= 0xff41 && cp <= 0xff5a) return String.fromCharCode(cp - 0xff41 + 97)
  return ch
}

function charToMorseTokens(ch: string, options: { chinese?: boolean }): string[] {
  const chinese = !!options.chinese
  ch = normalizeMorseChar(ch)
  if (isCjkChar(ch)) {
    if (!chinese) throw new Error('不支持中文，请勾选「中文电码」')
    if (!ctcCharToCode) throw new Error('中文电码表未加载')
    const digs = ctcCharToCode[ch]
    if (!digs) throw new Error('电码表无此字: "' + ch + '"')
    const tokens: string[] = []
    for (let di = 0; di < digs.length; di++) {
      tokens.push(MORSE_TABLE[digs.charAt(di)]!)
    }
    return tokens
  }
  const upper = ch.toUpperCase()
  const code = MORSE_TABLE[upper]
  if (!code) {
    throw new Error(
      '不支持的字符: "' +
        ch +
        '"（字母/数字/常用标点/扩展符号 #%*[]{}|<>^`\\~' +
        (chinese ? '/汉字' : '') +
        '）',
    )
  }
  return [code]
}

export type MorseEncodeOpts = {
  dot?: string
  dash?: string
  letterSep?: string
  wordSep?: string
  softSep?: string
  chinese?: boolean
}

export function morseEncode(text: string, options: MorseEncodeOpts = {}): string {
  const dot = options.dot ?? '.'
  const dash = options.dash ?? '-'
  const letterSep = options.letterSep ?? ' '
  const wordSep = options.wordSep ?? ' / '
  const softSep = options.softSep ?? ' // '
  if (!text) return ''

  const words = String(text).trim().split(/\s+/)
  const outWords: string[] = []
  for (const word of words) {
    if (!word) continue
    const segments: string[] = []
    let codes: string[] = []
    const chars = Array.from(word)
    let prevCjk: boolean | null = null
    for (const ch of chars) {
      const cjk = isCjkChar(ch)
      if (prevCjk !== null && cjk !== prevCjk && codes.length) {
        segments.push(codes.join(letterSep))
        codes = []
      }
      prevCjk = cjk
      const tokens = charToMorseTokens(ch, options)
      for (const token of tokens) {
        codes.push(applyDotDash(token, dot, dash))
      }
    }
    if (codes.length) segments.push(codes.join(letterSep))
    if (segments.length) outWords.push(segments.join(softSep))
  }
  return outWords.join(wordSep)
}

function assembleDecodedChars(chars: string[], chinese: boolean): string {
  if (!chinese || !ctcCodeToChar) return chars.join('')
  let out = ''
  let digitBuf = ''

  function flushDigits() {
    if (!digitBuf) return
    if (digitBuf.length % 4 !== 0) {
      out += digitBuf
      digitBuf = ''
      return
    }
    let pieces = ''
    for (let i = 0; i < digitBuf.length; i += 4) {
      const code = digitBuf.slice(i, i + 4)
      const ch = ctcCodeToChar![code]
      if (!ch) {
        out += digitBuf
        digitBuf = ''
        return
      }
      pieces += ch
    }
    out += pieces
    digitBuf = ''
  }

  for (const c of chars) {
    if (c >= '0' && c <= '9') {
      digitBuf += c
    } else {
      flushDigits()
      out += c
    }
  }
  flushDigits()
  return out
}

function decodeMorseSegment(part: string, lowerCase: boolean, chinese: boolean): string {
  const tokens = part.split(/\s+/)
  const chars: string[] = []
  for (const token of tokens) {
    if (!token) continue
    const cleaned = token.replace(/[^.\-]/g, '')
    if (!cleaned) throw new Error('非法摩斯码片段: "' + token + '"')
    const ch = MORSE_REVERSE[cleaned]
    if (!ch) throw new Error('未知摩斯码: "' + cleaned + '"')
    chars.push(lowerCase && /[A-Z]/.test(ch) ? ch.toLowerCase() : ch)
  }
  if (!chars.length) return ''
  return assembleDecodedChars(chars, chinese)
}

export type MorseDecodeOpts = { lowerCase?: boolean; chinese?: boolean }

export function morseDecode(code: string, options: MorseDecodeOpts = {}): string {
  const lowerCase = !!options.lowerCase
  const chinese = !!options.chinese
  if (!code) return ''

  let normalized = String(code)
    .replace(/[·•]/g, '.')
    .replace(/[—–−_]/g, '-')
    .replace(/[|／]/g, '/')
    .trim()

  const SOFT = '\x01'
  normalized = normalized.replace(/\s*\/\/+\s*/g, SOFT)

  const wordParts = normalized.split(/\s*\/\s*|\s{2,}/)
  const outWords: string[] = []
  for (const partRaw of wordParts) {
    const part = partRaw.trim()
    if (!part) continue
    const softParts = part.split(SOFT)
    let joined = ''
    for (const soft of softParts) {
      const seg = soft.trim()
      if (!seg) continue
      joined += decodeMorseSegment(seg, lowerCase, chinese)
    }
    if (joined) outWords.push(joined)
  }
  return outWords.join(' ')
}

export { MORSE_TABLE }
