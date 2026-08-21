/** Maven 坐标 → 依赖片段 */

export type MavenCoord = {
  groupId: string
  artifactId: string
  version: string
  packaging: string
  classifier: string
  scope: string
  optional: boolean
}

function xmlEscape(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function parseMavenCoord(raw: string): MavenCoord {
  const result: MavenCoord = {
    groupId: '',
    artifactId: '',
    version: '',
    packaging: '',
    classifier: '',
    scope: '',
    optional: false,
  }
  if (!raw || !String(raw).trim()) throw new Error('请输入 Maven 坐标')
  const text = String(raw).trim()

  if (/groupId\s*[=:]/i.test(text) || /artifactId\s*[=:]/i.test(text)) {
    text.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z]+)\s*[=:]\s*(.+?)\s*$/)
      if (!m) return
      const k = m[1]!.toLowerCase()
      const v = m[2]!.trim()
      if (k === 'groupid') result.groupId = v
      else if (k === 'artifactid') result.artifactId = v
      else if (k === 'version') result.version = v
      else if (k === 'packaging' || k === 'type') result.packaging = v
      else if (k === 'classifier') result.classifier = v
      else if (k === 'scope') result.scope = v
      else if (k === 'optional') result.optional = /^(true|1|yes)$/i.test(v)
    })
  } else {
    const line = text.split(/\r?\n/)[0]!.trim()
    let scopeFromAt = ''
    let core = line
    const at = line.lastIndexOf('@')
    if (at > 0) {
      scopeFromAt = line.slice(at + 1).trim()
      core = line.slice(0, at).trim()
    }
    const parts = core.split(':').map((p) => p.trim())
    if (parts.length < 2) throw new Error('格式应为 groupId:artifactId:version')
    result.groupId = parts[0]!
    result.artifactId = parts[1]!
    if (parts.length === 3) result.version = parts[2]!
    else if (parts.length === 4) {
      result.packaging = parts[2]!
      result.version = parts[3]!
    } else if (parts.length >= 5) {
      result.packaging = parts[2]!
      result.classifier = parts[3]!
      result.version = parts[4]!
    }
    if (scopeFromAt) result.scope = scopeFromAt
  }

  if (!result.groupId || !result.artifactId) throw new Error('groupId 与 artifactId 不能为空')
  if (result.packaging === 'jar') result.packaging = ''
  return result
}

function gradleConfig(scope: string, optional: boolean): string {
  if (optional) return 'compileOnly'
  if (scope === 'test') return 'testImplementation'
  if (scope === 'provided') return 'compileOnly'
  if (scope === 'runtime') return 'runtimeOnly'
  return 'implementation'
}

export function formatMavenDependency(coord: MavenCoord, options: { scope?: string; optional?: boolean } = {}) {
  const c = { ...coord }
  if (options.scope) c.scope = options.scope
  if (options.optional != null) c.optional = options.optional
  const type = c.packaging || ''
  const hasClassifier = !!c.classifier
  const hasType = !!type && type !== 'jar'

  let maven = '<dependency>\n'
  maven += `    <groupId>${xmlEscape(c.groupId)}</groupId>\n`
  maven += `    <artifactId>${xmlEscape(c.artifactId)}</artifactId>\n`
  if (c.version) maven += `    <version>${xmlEscape(c.version)}</version>\n`
  if (hasType) maven += `    <type>${xmlEscape(type)}</type>\n`
  if (hasClassifier) maven += `    <classifier>${xmlEscape(c.classifier)}</classifier>\n`
  if (c.scope && c.scope !== 'compile') maven += `    <scope>${xmlEscape(c.scope)}</scope>\n`
  if (c.optional) maven += '    <optional>true</optional>\n'
  maven += '</dependency>'

  let n = c.groupId + ':' + c.artifactId
  if (c.version) n += ':' + c.version
  if (hasClassifier) n += ':' + c.classifier
  if (hasType) n += '@' + type
  const conf = gradleConfig(c.scope, c.optional)
  const gradleGroovy = conf + " '" + n.replace(/'/g, "\\'") + "'"
  const gradleKotlin = conf + '("' + n.replace(/"/g, '\\"') + '")'

  let sbt = `"${c.groupId}" % "${c.artifactId}"`
  if (c.version) sbt += ` % "${c.version}"`
  if (c.scope === 'test') sbt += ' % Test'
  else if (c.scope === 'provided') sbt += ' % "provided"'

  let coords = c.groupId + ':' + c.artifactId
  if (c.version) coords += ':' + c.version

  return { maven, gradleGroovy, gradleKotlin, sbt, coords }
}

export function formatAllMaven(raw: string, scope = ''): string {
  const coord = parseMavenCoord(raw)
  const r = formatMavenDependency(coord, { scope: scope || undefined })
  return [
    '<!-- Maven -->',
    r.maven,
    '',
    '// Gradle Groovy',
    r.gradleGroovy,
    '',
    '// Gradle Kotlin',
    r.gradleKotlin,
    '',
    '// SBT',
    r.sbt,
    '',
    '// GAV',
    r.coords,
  ].join('\n')
}
