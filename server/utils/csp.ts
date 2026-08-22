/**
 * 主题防闪烁内联脚本（须与 nuxt.config app.head.script 保持字节级一致）。
 */
export const THEME_INIT_SCRIPT =
  "(function(){try{var t=localStorage.getItem('devcoffer:theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);var m=document.querySelector('meta[name=\"theme-color\"]');if(m)m.setAttribute('content',t==='light'?'#f4f7fb':'#0b1220');}}catch(e){}})();"

/** 对应 THEME_INIT_SCRIPT 的 CSP hash（sha256-…） */
export const THEME_INIT_SCRIPT_SHA256 = 'sha256-xfGMxxMX0yOe01DgdxzKSc4lVxWMkHPYnExGnh4KL4g='

/**
 * @param nonce 生产环境每请求 nonce；开发环境传空则使用 unsafe-inline（兼容 Vite/DevTools）
 */
export function buildCspHeader(nonce?: string): string {
  // 注意：script-src 一旦出现 nonce/hash，浏览器会忽略 'unsafe-inline'
  const scriptSrc = nonce
    ? // 生产：nonce + strict-dynamic；hash 兜底主题脚本
      `script-src 'nonce-${nonce}' 'strict-dynamic' '${THEME_INIT_SCRIPT_SHA256}'`
    : // 开发：仅 unsafe-inline（不可再加 hash，否则 DevTools/Vite 内联脚本会被拦）
      "script-src 'self' 'unsafe-inline'"

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob: https: http:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    scriptSrc,
    "script-src-attr 'none'",
    "connect-src 'self' https: http: ws: wss: blob: data:",
    "frame-src 'self' blob: data:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join('; ')
}
