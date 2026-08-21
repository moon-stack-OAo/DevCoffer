import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
  </defs>
  <rect width="180" height="180" rx="40" fill="#0b1220"/>
  <rect x="36" y="36" width="108" height="108" rx="28" fill="url(#g)"/>
  <text x="90" y="108" text-anchor="middle" fill="#e0f2fe" font-family="Segoe UI, Arial, sans-serif" font-size="48" font-weight="800">DC</text>
</svg>`

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1220"/>
      <stop offset="55%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="980" cy="80" r="220" fill="#38bdf8" fill-opacity="0.12"/>
  <circle cx="160" cy="540" r="180" fill="#818cf8" fill-opacity="0.12"/>
  <rect x="96" y="210" width="96" height="96" rx="24" fill="url(#mark)"/>
  <text x="120" y="272" fill="#e0f2fe" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="800">DC</text>
  <text x="220" y="250" fill="#f8fafc" font-family="Segoe UI, Arial, sans-serif" font-size="64" font-weight="800">DevCoffer</text>
  <text x="220" y="310" fill="#94a3b8" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="600">码柜 · 开发者工具箱</text>
  <text x="96" y="420" fill="#cbd5e1" font-family="Segoe UI, Arial, sans-serif" font-size="30">纯前端本地处理 · 数据不出浏览器</text>
  <text x="96" y="480" fill="#64748b" font-family="Segoe UI, Arial, sans-serif" font-size="24">JSON · Base64 · Hash · UUID · YAML · SQL</text>
</svg>`

await sharp(Buffer.from(appleSvg)).png().toFile(join(root, 'public', 'apple-touch-icon.png'))
await sharp(Buffer.from(ogSvg)).png().toFile(join(root, 'public', 'og.png'))
console.log('[seo-assets] wrote public/apple-touch-icon.png + public/og.png')
