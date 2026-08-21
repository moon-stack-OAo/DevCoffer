export function flexCss(opts: { direction: string; justify: string; align: string; gap: number; wrap: boolean }) {
    return [
        'display: flex;',
        'flex-direction: ' + opts.direction + ';',
        'justify-content: ' + opts.justify + ';',
        'align-items: ' + opts.align + ';',
        'gap: ' + opts.gap + 'px;',
        opts.wrap ? 'flex-wrap: wrap;' : 'flex-wrap: nowrap;',
    ].join('\n')
}

export function gridCss(
    cols: number,
    rows: number,
    gap: number,
    justifyItems = 'stretch',
    alignItems = 'stretch',
) {
    return [
        'display: grid;',
        'grid-template-columns: repeat(' + cols + ', 1fr);',
        'grid-template-rows: repeat(' + rows + ', auto);',
        'justify-items: ' + justifyItems + ';',
        'align-items: ' + alignItems + ';',
        'gap: ' + gap + 'px;',
    ].join('\n')
}
