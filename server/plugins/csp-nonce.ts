import { buildCspHeader } from '../utils/csp'

/**
 * 生产环境：把 nonce 写入所有 <script>，并在同一响应上设置匹配的 CSP。
 * CSP 随 HTML 同响应下发，避免中间件新 nonce 与 SWR 正文错配。
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const nonce = event.context.cspNonce as string | undefined
    if (!nonce) return

    const inject = (chunk: string) =>
      chunk.replace(/<script(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`)

    const mapArr = (arr?: string[]) => (arr ? arr.map(inject) : arr)

    html.head = mapArr(html.head) || html.head
    html.body = mapArr(html.body) || html.body
    html.bodyAppend = mapArr(html.bodyAppend) || html.bodyAppend
    html.bodyPrepend = mapArr(html.bodyPrepend) || html.bodyPrepend
  })

  nitroApp.hooks.hook('render:response', (response, { event }) => {
    const nonce = event.context.cspNonce as string | undefined
    if (!nonce) return
    // 兜底：若仍有漏网 <script>，再扫一遍响应体
    if (typeof response.body === 'string' && response.body.includes('<script')) {
      response.body = response.body.replace(
        /<script(?![^>]*\bnonce=)/gi,
        `<script nonce="${nonce}"`,
      )
    }
    response.headers = response.headers || {}
    response.headers['Content-Security-Policy'] = buildCspHeader(nonce)
  })
})
