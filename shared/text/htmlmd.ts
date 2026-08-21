export function htmlToMd(html: string): string {
    let s = String(html || '')
    s = s.replace(/<script[\s\S]*?<\/script>/gi, '')
    s = s.replace(/<style[\s\S]*?<\/style>/gi, '')
    s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, t) => '\n' + '#'.repeat(+n) + ' ' + strip(t) + '\n')
    s = s.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    s = s.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    s = s.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    s = s.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    s = s.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    s = s.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    s = s.replace(/<br\s*\/?>/gi, '\n')
    s = s.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n')
    s = s.replace(/<[^>]+>/g, '')
    s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    return s.replace(/\n{3,}/g, '\n\n').trim()
}

function strip(t: string) {
    return t.replace(/<[^>]+>/g, '').trim()
}

export function mdToHtmlLite(md: string): string {
    let s = String(md || '')
    s = s.replace(/^###### (.+)$/gm, '<h6>$1</h6>')
    s = s.replace(/^##### (.+)$/gm, '<h5>$1</h5>')
    s = s.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    s = s.replace(/^### (.+)$/gm, '<h3>$1</h3>')
    s = s.replace(/^## (.+)$/gm, '<h2>$1</h2>')
    s = s.replace(/^# (.+)$/gm, '<h1>$1</h1>')
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>')
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>')
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    s = s.replace(/^- (.+)$/gm, '<li>$1</li>')
    s = s.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    s = s
        .split(/\n\n+/)
        .map((p) => (/^<h|^<ul|^<li/.test(p.trim()) ? p : '<p>' + p.replace(/\n/g, '<br/>') + '</p>'))
        .join('\n')
    return s
}
