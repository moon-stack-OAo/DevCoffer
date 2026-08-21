export function faviconSvg(text: string, bg: string, fg: string, size = 64) {
    const t = (text || 'A').slice(0, 2)
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="100%" height="100%" rx="${Math.floor(size / 8)}" fill="${bg}"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="${Math.floor(size * 0.45)}" fill="${fg}">${escapeXml(t)}</text>
</svg>`
}

function escapeXml(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
