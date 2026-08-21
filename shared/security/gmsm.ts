/**
 * 国密占位：完整 SM2/SM4 需专用库。
 * 此处提供 SM3 简化说明 + 不可用于生产的演示摘要占位。
 */
import { md5Hex } from './md5'

export function gmsmInfo(): string {
    return [
        '国密算法说明（本工具为占位演示）',
        '- SM2: 椭圆曲线公钥，浏览器无原生支持，需专用 WASM/JS 库',
        '- SM3: 杂凑算法，类似 SHA-256',
        '- SM4: 分组对称加密',
        '',
        '当前未内嵌完整国密实现；下方「演示摘要」仅为占位，不可用于合规场景。',
        '推荐后续接入 sm-crypto / gm-crypt 等 ESM 库。',
    ].join('\n')
}

/** 非 SM3：仅占位，明确标注 */
export function gmsmDemoDigest(text: string): string {
    return 'DEMO-NOT-SM3:' + md5Hex('sm3-placeholder:' + text)
}
