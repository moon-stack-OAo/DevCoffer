export function plantumlWrap(body: string, title = 'Diagram'): string {
    const inner = String(body || '').trim()
    if (/@startuml/i.test(inner)) return inner
    return ['@startuml ' + title, inner || 'Alice -> Bob: hello', '@enduml'].join('\n')
}

export function ddlToPlantuml(ddl: string): string {
    const table = ddl.match(/create\s+table\s+[`"]?(\w+)/i)?.[1] || 'Entity'
    const cols = [...ddl.matchAll(/^\s*[`"']?(\w+)[`"']?\s+(\w+(?:\([^)]*\))?)/gim)]
        .filter((m) => !/^(create|table|primary|key|constraint|unique|index)$/i.test(m[1]!))
        .slice(0, 30)
    const lines = ['@startuml', 'entity ' + table + ' {']
    for (const m of cols) lines.push('  ' + m[1] + ' : ' + m[2])
    if (!cols.length) lines.push('  id : LONG')
    lines.push('}', '@enduml')
    return lines.join('\n')
}
