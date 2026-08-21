/** .gitignore 常见模板拼接 */

export type GitignoreTemplate = {
    id: string
    name: string
    group: string
    rules: string[]
}

export const gitignoreTemplates: GitignoreTemplate[] = [
    {
        id: 'node',
        name: 'Node',
        group: '语言',
        rules: [
            'node_modules/', 'npm-debug.log*', 'yarn-debug.log*', 'yarn-error.log*', 'pnpm-debug.log*',
            'dist/', 'build/', 'coverage/', '.nyc_output/', '*.tsbuildinfo', '.npm', '.eslintcache',
        ],
    },
    {
        id: 'python',
        name: 'Python',
        group: '语言',
        rules: [
            '__pycache__/', '*.py[cod]', '*$py.class', '.Python', 'venv/', '.venv/', 'env/',
            '*.egg-info/', '.eggs/', 'dist/', 'build/', '.pytest_cache/', '.mypy_cache/', '.ruff_cache/',
            '.coverage', 'htmlcov/',
        ],
    },
    {
        id: 'java',
        name: 'Java',
        group: '语言',
        rules: ['target/', '*.class', '*.jar', '*.war', '*.ear', '*.log', 'hs_err_pid*', 'replay_pid*'],
    },
    {
        id: 'go',
        name: 'Go',
        group: '语言',
        rules: ['bin/', 'pkg/', '*.exe', '*.dll', '*.so', '*.dylib', '*.test', '*.out', 'vendor/', 'go.work'],
    },
    {
        id: 'rust',
        name: 'Rust',
        group: '语言',
        rules: ['/target/', '**/*.rs.bk', '*.pdb'],
    },
    {
        id: 'vue',
        name: 'Vue/Vite/Nuxt',
        group: '框架',
        rules: [
            'node_modules/', 'dist/', 'dist-ssr/', '*.local', '.vite/', '.turbo/', '.output/',
            '.nuxt/', '.vercel/', '.netlify/',
        ],
    },
    {
        id: 'react',
        name: 'React/Next',
        group: '框架',
        rules: ['node_modules/', 'build/', 'dist/', '.next/', 'out/', '.cache/', '.parcel-cache/', '*.tsbuildinfo'],
    },
    {
        id: 'springboot',
        name: 'Spring Boot',
        group: '框架',
        rules: ['target/', '.mvn/wrapper/maven-wrapper.jar', '*.iml', '.idea/', '.classpath', '.project', '.settings/'],
    },
    {
        id: 'ide',
        name: 'IDE / OS',
        group: '环境',
        rules: [
            '.idea/', '*.iml', '.vscode/*', '!.vscode/extensions.json', '.DS_Store', 'Thumbs.db',
            '*~', '*.swp', '*.swo',
        ],
    },
    {
        id: 'env',
        name: '环境变量',
        group: '环境',
        rules: ['.env', '.env.*', '!.env.example', '*.pem', '*.key', 'secrets/'],
    },
    {
        id: 'docker',
        name: 'Docker',
        group: '环境',
        rules: ['.docker/', 'docker-compose.override.yml'],
    },
    {
        id: 'logs',
        name: '日志',
        group: '环境',
        rules: ['logs/', '*.log', 'npm-debug.log*', 'yarn-error.log*'],
    },
    {
        id: 'android',
        name: 'Android',
        group: '移动端',
        rules: [
            '*.iml', '.gradle/', 'local.properties', '/.idea/', '.DS_Store', '/build/',
            '/captures/', '.externalNativeBuild/', '.cxx/', '*.apk', '*.ap_', '*.aab',
        ],
    },
    {
        id: 'ios',
        name: 'iOS / Xcode',
        group: '移动端',
        rules: [
            'build/', 'DerivedData/', '*.xcuserstate', 'xcuserdata/', '*.xccheckout',
            '*.moved-aside', '*.hmap', '*.ipa', '*.dSYM.zip', '*.dSYM', 'Pods/',
            '.swiftpm/', 'Package.resolved',
        ],
    },
    {
        id: 'dotnet',
        name: '.NET',
        group: '语言',
        rules: [
            'bin/', 'obj/', '*.user', '*.suo', '*.userosscache', '*.sln.docstates',
            '[Dd]ebug/', '[Rr]elease/', 'x64/', 'x86/', '[Bb]in/', '[Oo]bj/',
            '.vs/', '*.nupkg', 'project.lock.json', 'artifacts/',
        ],
    },
    {
        id: 'flutter',
        name: 'Flutter / Dart',
        group: '移动端',
        rules: [
            '.dart_tool/', '.packages', '.pub-cache/', '.pub/', 'build/',
            '.flutter-plugins', '.flutter-plugins-dependencies', '.metadata',
            '**/ios/Pods/', '**/android/.gradle/',
        ],
    },
    {
        id: 'csharp',
        name: 'C# / Unity',
        group: '语言',
        rules: [
            '[Ll]ibrary/', '[Tt]emp/', '[Oo]bj/', '[Bb]uild/', '[Bb]uilds/',
            '[Ll]ogs/', '[Uu]ser[Ss]ettings/', '*.csproj.user', '*.pidb', '*.booproj',
            '*.svd', '*.pdb', '*.mdb', '*.opendb', '*.VC.db',
        ],
    },
]

export function gitignoreMerge(selectedIds: string[], customRules?: string): string {
    const ids = Array.isArray(selectedIds) ? selectedIds : []
    const byId = Object.create(null) as Record<string, GitignoreTemplate>
    for (const t of gitignoreTemplates) byId[t.id] = t
    const seen: Record<string, boolean> = Object.create(null)
    const parts: string[] = []
    for (const id of ids) {
        const tpl = byId[id]
        if (!tpl) continue
        const lines: string[] = []
        for (const rule of tpl.rules) {
            const r = String(rule).trim()
            if (!r || seen[r]) continue
            seen[r] = true
            lines.push(r)
        }
        if (!lines.length) continue
        parts.push('# === ' + tpl.name + ' ===')
        parts.push(lines.join('\n'))
    }
    const custom = String(customRules || '')
        .split(/\r?\n/)
        .map((l) => l.trimEnd())
        .filter((l) => {
            const t = l.trim()
            if (!t || t.startsWith('#')) return !!t
            if (seen[t]) return false
            seen[t] = true
            return true
        })
    if (custom.length) {
        parts.push('# === 自定义 ===')
        parts.push(custom.join('\n'))
    }
    if (!parts.length) return '# 请勾选至少一种模板，或填写自定义规则\n'
    return parts.join('\n\n') + '\n'
}

export function gitignoreGroups() {
    const order: string[] = []
    const map: Record<string, GitignoreTemplate[]> = Object.create(null)
    for (const t of gitignoreTemplates) {
        if (!map[t.group]) {
            map[t.group] = []
            order.push(t.group)
        }
        map[t.group]!.push(t)
    }
    return order.map((g) => ({ group: g, items: map[g]! }))
}