export function cubicBezierCss(x1: number, y1: number, x2: number, y2: number) {
    const clamp = (n: number) => Math.max(0, Math.min(1, n))
    return (
        'transition-timing-function: cubic-bezier(' +
        [clamp(x1), y1, clamp(x2), y2].map((n) => +n.toFixed(3)).join(', ') +
        ');'
    )
}

export const PRESETS: Record<string, [number, number, number, number]> = {
    ease: [0.25, 0.1, 0.25, 1],
    'ease-in': [0.42, 0, 1, 1],
    'ease-out': [0, 0, 0.58, 1],
    'ease-in-out': [0.42, 0, 0.58, 1],
    linear: [0, 0, 1, 1],
}
