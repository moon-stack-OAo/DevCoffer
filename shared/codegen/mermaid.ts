export function mermaidWrap(body: string, type: 'flowchart' | 'sequenceDiagram' | 'classDiagram' = 'flowchart'): string {
    const inner = String(body || '').trim()
    if (/^(graph|flowchart|sequenceDiagram|classDiagram|erDiagram)/i.test(inner)) return inner
    if (type === 'sequenceDiagram') return 'sequenceDiagram\n  Alice->>Bob: hello'
    if (type === 'classDiagram') return 'classDiagram\n  class Demo {\n    +id: number\n  }'
    return 'flowchart TD\n  A[Start] --> B[End]'
}

export function ddlToMermaidEr(ddl: string): string {
    const table = ddl.match(/create\s+table\s+[`"]?(\w+)/i)?.[1] || 'demo'
    const cols = [...ddl.matchAll(/^\s*[`"']?(\w+)[`"']?\s+(\w+)/gim)]
        .map((m) => m[1]!)
        .filter((c) => !/^(create|table|primary|key|constraint|unique|index)$/i.test(c))
        .slice(0, 20)
    const lines = ['erDiagram', '  ' + table + ' {']
    for (const c of cols.length ? cols : ['id', 'name']) {
        lines.push('    string ' + c)
    }
    lines.push('  }')
    return lines.join('\n')
}
