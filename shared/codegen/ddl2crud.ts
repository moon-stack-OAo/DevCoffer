export function ddlToCrud(ddl: string, className = 'Entity'): string {
    const table = ddl.match(/create\s+table\s+[`"]?(\w+)/i)?.[1] || 'demo'
    const cols = [...ddl.matchAll(/^\s*[`"']?(\w+)[`"']?\s+(\w+)/gim)]
        .map((m) => m[1]!)
        .filter((c) => !/^(create|table|primary|key|constraint|unique|index)$/i.test(c))
    const fields = cols.length ? cols : ['id', 'name']
    const cn = className || 'Entity'
    return [
        `// CRUD 模板 · 表 ${table}`,
        `public interface ${cn}Mapper {`,
        `  ${cn} selectById(Long id);`,
        `  int insert(${cn} entity);`,
        `  int updateById(${cn} entity);`,
        `  int deleteById(Long id);`,
        `}`,
        '',
        `/* 示例字段: ${fields.join(', ')} */`,
        `public class ${cn}Service {`,
        `  // select / insert / update / delete 委托 Mapper`,
        `}`,
    ].join('\n')
}
