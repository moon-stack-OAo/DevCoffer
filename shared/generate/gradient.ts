export function linearGradient(angle: number, c1: string, c2: string, c3?: string) {
    const stops = c3 ? c1 + ', ' + c2 + ', ' + c3 : c1 + ', ' + c2
    return 'background: linear-gradient(' + angle + 'deg, ' + stops + ');'
}

export function radialGradient(c1: string, c2: string) {
    return 'background: radial-gradient(circle, ' + c1 + ', ' + c2 + ');'
}
