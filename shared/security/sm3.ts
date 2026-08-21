/** SM3 国密杂凑（纯 TS，无外部依赖） */

function rotl(x: number, n: number): number {
  const t = n & 31
  return ((x << t) | (x >>> (32 - t))) >>> 0
}

function ff(x: number, y: number, z: number, j: number): number {
  return j <= 15 ? (x ^ y ^ z) >>> 0 : ((x & y) | (x & z) | (y & z)) >>> 0
}

function gg(x: number, y: number, z: number, j: number): number {
  return j <= 15 ? (x ^ y ^ z) >>> 0 : ((x & y) | (~x & z)) >>> 0
}

function p0(x: number): number {
  return (x ^ rotl(x, 9) ^ rotl(x, 17)) >>> 0
}

function p1(x: number): number {
  return (x ^ rotl(x, 15) ^ rotl(x, 23)) >>> 0
}

function toHex(words: Uint32Array): string {
  let out = ''
  for (let i = 0; i < words.length; i++) {
    out += words[i]!.toString(16).padStart(8, '0')
  }
  return out
}

/** 对 UTF-8 字节做 SM3，返回小写 hex（64 字符） */
export function sm3Bytes(msg: Uint8Array): string {
  const bitLen = msg.length * 8
  let padLen = 56 - ((msg.length + 1) % 64)
  if (padLen < 0) padLen += 64
  const total = msg.length + 1 + padLen + 8
  const buf = new Uint8Array(total)
  buf.set(msg)
  buf[msg.length] = 0x80
  // 大端 64-bit 长度（本实现消息长度不超 2^32 位，高 32 位为 0）
  const view = new DataView(buf.buffer)
  view.setUint32(total - 4, bitLen >>> 0, false)

  const V = new Uint32Array([
    0x7380166f, 0x4914b2b9, 0x172442d7, 0xda8a0600,
    0xa96f30bc, 0x163138aa, 0xe38dee4d, 0xb0fb0e4e,
  ])
  const W = new Uint32Array(68)
  const W1 = new Uint32Array(64)

  for (let offset = 0; offset < total; offset += 64) {
    for (let i = 0; i < 16; i++) {
      W[i] = view.getUint32(offset + i * 4, false)
    }
    for (let j = 16; j < 68; j++) {
      W[j] = (p1(W[j - 16]! ^ W[j - 9]! ^ rotl(W[j - 3]!, 15)) ^ rotl(W[j - 13]!, 7) ^ W[j - 6]!) >>> 0
    }
    for (let j = 0; j < 64; j++) {
      W1[j] = (W[j]! ^ W[j + 4]!) >>> 0
    }

    let A = V[0]!
    let B = V[1]!
    let C = V[2]!
    let D = V[3]!
    let E = V[4]!
    let F = V[5]!
    let G = V[6]!
    let H = V[7]!

    for (let j = 0; j < 64; j++) {
      const T = j <= 15 ? 0x79cc4519 : 0x7a879d8a
      const SS1 = rotl((rotl(A, 12) + E + rotl(T, j)) >>> 0, 7)
      const SS2 = (SS1 ^ rotl(A, 12)) >>> 0
      const TT1 = (ff(A, B, C, j) + D + SS2 + W1[j]!) >>> 0
      const TT2 = (gg(E, F, G, j) + H + SS1 + W[j]!) >>> 0
      D = C
      C = rotl(B, 9)
      B = A
      A = TT1
      H = G
      G = rotl(F, 19)
      F = E
      E = p0(TT2)
    }

    V[0] = (V[0]! ^ A) >>> 0
    V[1] = (V[1]! ^ B) >>> 0
    V[2] = (V[2]! ^ C) >>> 0
    V[3] = (V[3]! ^ D) >>> 0
    V[4] = (V[4]! ^ E) >>> 0
    V[5] = (V[5]! ^ F) >>> 0
    V[6] = (V[6]! ^ G) >>> 0
    V[7] = (V[7]! ^ H) >>> 0
  }

  return toHex(V)
}

/** 对字符串按 UTF-8 编码后计算 SM3 */
export function sm3Hex(text: string): string {
  return sm3Bytes(new TextEncoder().encode(text))
}
