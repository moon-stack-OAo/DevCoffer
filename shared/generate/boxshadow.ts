export type BoxShadowOpts = {
    x: number
    y: number
    blur: number
    spread: number
    color: string
    inset: boolean
}

export function boxShadowCss(o: BoxShadowOpts) {
    const parts = [o.inset ? 'inset' : '', o.x + 'px', o.y + 'px', o.blur + 'px', o.spread + 'px', o.color].filter(Boolean)
    return 'box-shadow: ' + parts.join(' ') + ';'
}
