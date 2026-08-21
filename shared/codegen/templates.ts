/** 代码生成类模板工具 */

function toPascal(name: string): string {
  return String(name || 'Entity')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') || 'Entity'
}

function toCamel(name: string): string {
  const p = toPascal(name)
  return p.charAt(0).toLowerCase() + p.slice(1)
}

export function jsonToCode(jsonText: string, lang: string, root = 'Root'): string {
  let data: unknown
  try {
    data = JSON.parse(String(jsonText || ''))
  } catch {
    throw new Error('JSON 解析失败')
  }
  const name = toPascal(root)
  if (lang === 'java') return jsonToJavaRough(data, name)
  if (lang === 'go') return jsonToGoRough(data, name)
  if (lang === 'python') return jsonToPythonRough(data, name)
  if (lang === 'ts') {
    // 轻量内联，避免循环依赖
    return jsonToTsRough(data, name)
  }
  throw new Error('支持 lang: java|go|python|ts')
}

function jsonToTsRough(val: unknown, name: string): string {
  if (val === null || typeof val !== 'object') return `export type ${name} = ${typeof val === 'number' ? 'number' : typeof val}`
  if (Array.isArray(val)) return jsonToTsRough(val[0] ?? null, name + 'Item') + `\nexport type ${name} = ${name}Item[]`
  const fields = Object.entries(val as object).map(([k, v]) => {
    const t =
      v === null
        ? 'null'
        : Array.isArray(v)
          ? 'unknown[]'
          : typeof v === 'object'
            ? toPascal(k)
            : typeof v
    return `  ${k}: ${t};`
  })
  const nested = Object.entries(val as object)
    .filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v))
    .map(([k, v]) => jsonToTsRough(v, toPascal(k)))
  return [...nested, `export interface ${name} {\n${fields.join('\n')}\n}`].join('\n\n')
}

function jsonToJavaRough(val: unknown, name: string): string {
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    return `public class ${name} {\n  // 请提供 JSON 对象\n}`
  }
  const fields: string[] = []
  const nested: string[] = []
  for (const [k, v] of Object.entries(val as object)) {
    let t = 'String'
    if (typeof v === 'number') t = Number.isInteger(v) ? 'Integer' : 'Double'
    else if (typeof v === 'boolean') t = 'Boolean'
    else if (Array.isArray(v)) t = 'List<Object>'
    else if (v && typeof v === 'object') {
      t = toPascal(k)
      nested.push(jsonToJavaRough(v, t))
    }
    fields.push(`    private ${t} ${toCamel(k)};`)
  }
  return [
    ...nested,
    `public class ${name} {`,
    ...fields,
    `}`,
  ].join('\n')
}

function jsonToGoRough(val: unknown, name: string): string {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return `type ${name} struct {}`
  const lines = [`type ${name} struct {`]
  for (const [k, v] of Object.entries(val as object)) {
    let t = 'string'
    if (typeof v === 'number') t = 'float64'
    else if (typeof v === 'boolean') t = 'bool'
    else if (Array.isArray(v)) t = '[]any'
    else if (v && typeof v === 'object') t = toPascal(k)
    lines.push(`  ${toPascal(k)} ${t} \`json:"${k}"\``)
  }
  lines.push('}')
  return lines.join('\n')
}

function jsonToPythonRough(val: unknown, name: string): string {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return `class ${name}:\n    pass`
  const lines = ['from dataclasses import dataclass', '', '@dataclass', `class ${name}:`]
  for (const [k, v] of Object.entries(val as object)) {
    let t = 'str'
    if (typeof v === 'number') t = 'float'
    else if (typeof v === 'boolean') t = 'bool'
    else if (Array.isArray(v)) t = 'list'
    else if (v && typeof v === 'object') t = 'dict'
    lines.push(`    ${k}: ${t}`)
  }
  return lines.join('\n')
}

/** CREATE TABLE 粗解析 → Java 字段 */
export function ddlToJavaFields(ddl: string, className = 'Entity'): string {
  const text = String(ddl || '')
  const m = text.match(/create\s+table\s+[`"]?(\w+)[`"]?\s*\(([\s\S]+)\)/i)
  if (!m) throw new Error('请输入 CREATE TABLE ... (...)')
  const table = m[1]!
  const body = m[2]!
  const cols: { name: string; javaType: string }[] = []
  for (const line of body.split(/,\s*\n|,\n/)) {
    const s = line.trim().replace(/,$/, '')
    if (!s || /^(primary|unique|key|constraint|index|foreign)\b/i.test(s)) continue
    const cm = s.match(/^[`"]?(\w+)[`"]?\s+(\w+)/i)
    if (!cm) continue
    cols.push({ name: cm[1]!, javaType: sqlTypeToJava(cm[2]!) })
  }
  const cn = toPascal(className || table)
  const fields = cols
    .map((c) => `    private ${c.javaType} ${toCamel(c.name)};`)
    .join('\n')
  return [
    `// table: ${table}`,
    `public class ${cn} {`,
    fields,
    '}',
  ].join('\n')
}

function sqlTypeToJava(t: string): string {
  const u = t.toLowerCase()
  if (/int|serial/.test(u)) return 'Long'
  if (/bigint/.test(u)) return 'Long'
  if (/decimal|numeric|double|float/.test(u)) return 'BigDecimal'
  if (/bool|bit/.test(u)) return 'Boolean'
  if (/date|time/.test(u)) return 'LocalDateTime'
  if (/json|text|char|uuid|varchar|clob/.test(u)) return 'String'
  return 'String'
}

export function sqlToMybatisMapper(javaType: string, method = 'selectById'): string {
  const type = toPascal(javaType || 'User')
  return `public interface ${type}Mapper {

    @Select("SELECT * FROM t_${toCamel(type)} WHERE id = #{id}")
    ${type} ${method}(@Param("id") Long id);

    @Insert("INSERT INTO t_${toCamel(type)}(name) VALUES(#{name})")
    int insert(${type} row);

    @Update("UPDATE t_${toCamel(type)} SET name=#{name} WHERE id=#{id}")
    int updateById(${type} row);

    @Delete("DELETE FROM t_${toCamel(type)} WHERE id=#{id}")
    int deleteById(@Param("id") Long id);
}
`
}

export function feignSkeleton(service: string, path = '/api'): string {
  const name = toPascal(service || 'Demo') + 'Client'
  return `@FeignClient(name = "${service || 'demo-service'}", path = "${path}")
public interface ${name} {

    @GetMapping("/{id}")
    Result<Object> getById(@PathVariable("id") Long id);

    @PostMapping
    Result<Object> create(@RequestBody Map<String, Object> body);
}
`
}

export function flywayTemplate(version: string, desc: string): string {
  const ver = String(version || '1').replace(/[^\d.]/g, '') || '1'
  const d = String(desc || 'init').replace(/[^\w]+/g, '_')
  const file = `V${ver}__${d}.sql`
  return `-- ${file}
-- Flyway migration

CREATE TABLE IF NOT EXISTS demo (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`
}

export function mapstructTemplate(source: string, target: string): string {
  const s = toPascal(source || 'UserDO')
  const t = toPascal(target || 'UserDTO')
  return `@Mapper(componentModel = "spring")
public interface ${s}To${t}Mapper {

    ${t} toDto(${s} source);

    ${s} toDo(${t} source);

    List<${t}> toDtoList(List<${s}> list);
}
`
}

export function entityConvertTemplate(entity: string): string {
  const e = toPascal(entity || 'User')
  return `public final class ${e}Converter {
    private ${e}Converter() {}

    public static ${e}DTO toDto(${e}DO source) {
        if (source == null) return null;
        ${e}DTO dto = new ${e}DTO();
        dto.setId(source.getId());
        dto.setName(source.getName());
        return dto;
    }

    public static ${e}DO toDo(${e}DTO source) {
        if (source == null) return null;
        ${e}DO d = new ${e}DO();
        d.setId(source.getId());
        d.setName(source.getName());
        return d;
    }
}
`
}

export function testGenTemplate(className: string, framework: 'junit5' | 'jmh' = 'junit5'): string {
  const c = toPascal(className || 'FooService')
  if (framework === 'jmh') {
    return `@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
@State(Scope.Thread)
public class ${c}Benchmark {

    @Benchmark
    public void measure() {
        // TODO
    }

    public static void main(String[] args) throws Exception {
        org.openjdk.jmh.Main.main(args);
    }
}
`
  }
  return `class ${c}Test {

    @Test
    void shouldWork() {
        // given
        // when
        // then
        Assertions.assertTrue(true);
    }
}
`
}

export type JmhProOptions = {
  modes?: string[]
  timeUnit?: string
  scope?: string
  warmup?: number
  measurement?: number
  forks?: number
  timeoutSec?: number
  withGroup?: boolean
  withCompilerControl?: boolean
  withTimeout?: boolean
}

/** JMH 进阶骨架：多 Mode / Group / CompilerControl / Timeout */
export function jmhProTemplate(className: string, opts: JmhProOptions = {}): string {
  const c = toPascal(className || 'Sample')
  const modes = (opts.modes?.length ? opts.modes : ['AverageTime', 'Throughput'])
    .map((m) => `Mode.${m}`)
    .join(', ')
  const timeUnit = opts.timeUnit || 'MICROSECONDS'
  const scope = opts.scope || 'Thread'
  const warmup = opts.warmup ?? 2
  const measurement = opts.measurement ?? 5
  const forks = opts.forks ?? 1
  const timeoutSec = opts.timeoutSec ?? 10
  const withGroup = opts.withGroup !== false
  const withCc = opts.withCompilerControl !== false
  const withTimeout = opts.withTimeout !== false

  const lines: string[] = [
    'import org.openjdk.jmh.annotations.*;',
    'import org.openjdk.jmh.infra.Blackhole;',
    '',
    'import java.util.concurrent.TimeUnit;',
    '',
    `@BenchmarkMode({${modes}})`,
    `@OutputTimeUnit(TimeUnit.${timeUnit})`,
    `@Warmup(iterations = ${warmup}, time = 1, timeUnit = TimeUnit.SECONDS)`,
    `@Measurement(iterations = ${measurement}, time = 1, timeUnit = TimeUnit.SECONDS)`,
    `@Fork(${forks})`,
    `@State(Scope.${scope})`,
  ]
  if (withTimeout) {
    lines.push(`@Timeout(time = ${timeoutSec}, timeUnit = TimeUnit.SECONDS)`)
  }
  lines.push(`public class ${c}Benchmark {`, '')
  lines.push('    @Setup(Level.Trial)')
  lines.push('    public void setup() {')
  lines.push('        // TODO: 准备基准数据')
  lines.push('    }')
  lines.push('')

  if (withGroup) {
    lines.push('    @Group("g")')
    lines.push('    @GroupThreads(2)')
    lines.push('    @Benchmark')
    if (withCc) {
      lines.push('    @CompilerControl(CompilerControl.Mode.DONT_INLINE)')
    }
    lines.push('    public void reader(Blackhole bh) {')
    lines.push('        bh.consume(System.nanoTime());')
    lines.push('    }')
    lines.push('')
    lines.push('    @Group("g")')
    lines.push('    @GroupThreads(1)')
    lines.push('    @Benchmark')
    lines.push('    public void writer(Blackhole bh) {')
    lines.push('        bh.consume(System.currentTimeMillis());')
    lines.push('    }')
  } else {
    lines.push('    @Benchmark')
    if (withCc) {
      lines.push('    @CompilerControl(CompilerControl.Mode.DONT_INLINE)')
    }
    lines.push('    public void measure(Blackhole bh) {')
    lines.push('        bh.consume(System.nanoTime());')
    lines.push('    }')
  }

  lines.push('')
  lines.push('    public static void main(String[] args) throws Exception {')
  lines.push('        org.openjdk.jmh.Main.main(args);')
  lines.push('    }')
  lines.push('}')
  lines.push('')
  return lines.join('\n')
}
