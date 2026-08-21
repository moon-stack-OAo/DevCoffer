export type ColorParts = { hex: string; r: number; g: number; b: number; h: number; s: number; l: number }

export function parseColor(input: string): ColorParts {
    const s = input.trim()
    let r = 0
    let g = 0
    let b = 0
    if (/^#?[0-9a-fA-F]{3}$/.test(s) || /^#?[0-9a-fA-F]{6}$/.test(s)) {
        let h = s.replace('#', '')
        if (h.length === 3) h = h.split('').map((c) => c + c).join('')
        r = parseInt(h.slice(0, 2), 16)
        g = parseInt(h.slice(2, 4), 16)
        b = parseInt(h.slice(4, 6), 16)
    } else {
        const rgb = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
        if (rgb) {
            r = clampByte(+rgb[1]!)
            g = clampByte(+rgb[2]!)
            b = clampByte(+rgb[3]!)
        } else {
            const hsl = s.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i)
            if (!hsl) throw new Error('支持 #RGB/#RRGGBB、rgb(a)、hsl(a)')
            const rgbFromHsl = hslToRgb(+hsl[1]!, +hsl[2]!, +hsl[3]!)
            r = rgbFromHsl.r
            g = rgbFromHsl.g
            b = rgbFromHsl.b
        }
    }
    const hslOut = rgbToHsl(r, g, b)
    const hex = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
    return { hex, r, g, b, ...hslOut }
}

function clampByte(n: number) {
    if (!isFinite(n)) return 0
    return Math.max(0, Math.min(255, Math.round(n)))
}

export function hslToRgb(h: number, s: number, l: number) {
    let hh = ((h % 360) + 360) % 360
    const ss = Math.max(0, Math.min(100, s)) / 100
    const ll = Math.max(0, Math.min(100, l)) / 100
    if (ss === 0) {
        const v = Math.round(ll * 255)
        return { r: v, g: v, b: v }
    }
    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss
    const p = 2 * ll - q
    const hk = hh / 360
    const tr = hk + 1 / 3
    const tg = hk
    const tb = hk - 1 / 3
    const channel = (t: number) => {
        let x = t
        if (x < 0) x += 1
        if (x > 1) x -= 1
        if (x < 1 / 6) return p + (q - p) * 6 * x
        if (x < 1 / 2) return q
        if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
        return p
    }
    return {
        r: Math.round(channel(tr) * 255),
        g: Math.round(channel(tg) * 255),
        b: Math.round(channel(tb) * 255),
    }
}

function rgbToHsl(r: number, g: number, b: number) {
    r /= 255
    g /= 255
    b /= 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2
    if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0)
                break
            case g:
                h = (b - r) / d + 2
                break
            default:
                h = (r - g) / d + 4
        }
        h /= 6
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function formatColor(c: ColorParts): string {
    return [
        'HEX: ' + c.hex,
        'RGB: rgb(' + c.r + ', ' + c.g + ', ' + c.b + ')',
        'HSL: hsl(' + c.h + ', ' + c.s + '%, ' + c.l + '%)',
    ].join('\n')
}
