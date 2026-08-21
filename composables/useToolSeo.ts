import { SITE, absUrl, clipMeta } from '~/utils/site'

type ToolLike = {
    id: string
    name: string
    desc?: string
    cat?: string
    /** 分类展示名（面包屑用） */
    catName?: string
    tags?: string[]
}
type CatLike = { id: string; name: string }

function applyPageSeo(opts: {
    title: string
    description: string
    path: string
    keywords?: string[]
    type?: 'website' | 'article'
    jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}) {
    const url = absUrl(opts.path)
    const description = clipMeta(opts.description)
    const title = opts.title
    const keywords = [...new Set([...(opts.keywords || []), ...SITE.keywords])].join(',')
    const ogImage = absUrl('/og.svg')

    useSeoMeta({
        title,
        description,
        keywords,
        robots: 'index,follow,max-image-preview:large',
        author: SITE.name,
        ogTitle: title,
        ogDescription: description,
        ogUrl: url,
        ogType: opts.type || 'website',
        ogSiteName: SITE.brand,
        ogLocale: SITE.locale,
        ogImage,
        ogImageAlt: SITE.brand,
        twitterCard: 'summary_large_image',
        twitterTitle: title,
        twitterDescription: description,
        twitterImage: ogImage,
    })

    const scripts = []
    if (opts.jsonLd) {
        const nodes = Array.isArray(opts.jsonLd) ? opts.jsonLd : [opts.jsonLd]
        for (const node of nodes) {
            scripts.push({
                type: 'application/ld+json',
                children: JSON.stringify(node),
            })
        }
    }

    useHead({
        title,
        htmlAttrs: { lang: SITE.lang },
        link: [
            { rel: 'canonical', href: url },
            { rel: 'alternate', hreflang: 'zh-CN', href: url },
            { rel: 'alternate', hreflang: 'x-default', href: url },
        ],
        meta: [
            { name: 'theme-color', content: SITE.themeColor },
            { name: 'application-name', content: SITE.name },
            { name: 'format-detection', content: 'telephone=no' },
        ],
        script: scripts,
    })
}

function breadcrumbLd(items: { name: string; path: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((it, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: it.name,
            item: absUrl(it.path),
        })),
    }
}

export function useToolSeo(tool: ToolLike) {
    const title = `${tool.name} 在线工具 · ${SITE.name}`
    const description = clipMeta(
        tool.desc
            ? `${tool.desc}。${SITE.name}（码柜）提供免费在线使用 ${tool.name}，纯前端本地处理，数据不出浏览器。`
            : `${tool.name} 在线工具 —— ${SITE.defaultDescription}`,
    )
    const path = `/t/${tool.id}`
    const url = absUrl(path)
    const keywords = [tool.name, tool.id, ...(tool.tags || []), tool.cat || ''].filter(Boolean)

    applyPageSeo({
        title,
        description,
        path,
        keywords,
        type: 'website',
        jsonLd: [
            {
                '@context': 'https://schema.org',
                '@type': 'WebApplication',
                name: tool.name,
                alternateName: `${tool.name} · ${SITE.brand}`,
                description,
                url,
                applicationCategory: 'DeveloperApplication',
                operatingSystem: 'Any',
                browserRequirements: 'Requires JavaScript',
                inLanguage: SITE.lang,
                isAccessibleForFree: true,
                offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'CNY',
                },
                publisher: {
                    '@type': 'Organization',
                    name: SITE.brand,
                    url: SITE.url,
                },
            },
            breadcrumbLd([
                { name: '首页', path: '/' },
                ...(tool.cat
                    ? [{ name: tool.catName || tool.cat, path: `/c/${tool.cat}` }]
                    : []),
                { name: tool.name, path },
            ]),
            {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: [
                    {
                        '@type': 'Question',
                        name: `${tool.name} 会上传我的数据吗？`,
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: '不会。DevCoffer 工具默认在浏览器本地处理，服务端不做编解码，用户输入默认不出站。',
                        },
                    },
                    {
                        '@type': 'Question',
                        name: `${tool.name} 是否免费？`,
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: `是的，${tool.name} 在 DevCoffer（码柜）上可免费使用。`,
                        },
                    },
                ],
            },
        ],
    })
}

export function useCategorySeo(
    cat: CatLike,
    tools?: { id: string; name: string; desc?: string }[],
) {
    const count = tools?.length ?? 0
    const title = `${cat.name}在线工具合集 · ${SITE.name}`
    const description = clipMeta(
        count > 0
            ? `${SITE.brand}「${cat.name}」分类共 ${count} 个免费在线工具，纯前端本地处理，数据不出浏览器。`
            : `${SITE.brand}「${cat.name}」分类在线工具，纯前端本地处理，数据不出浏览器。`,
    )
    const path = `/c/${cat.id}`

    const jsonLd: Record<string, unknown>[] = [
        breadcrumbLd([
            { name: '首页', path: '/' },
            { name: cat.name, path },
        ]),
        {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${cat.name}在线工具`,
            description,
            url: absUrl(path),
            isPartOf: { '@type': 'WebSite', name: SITE.brand, url: SITE.url },
            inLanguage: SITE.lang,
        },
    ]

    if (tools?.length) {
        jsonLd.push({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `${cat.name}工具列表`,
            numberOfItems: tools.length,
            itemListElement: tools.slice(0, 50).map((t, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: t.name,
                url: absUrl(`/t/${t.id}`),
                description: t.desc || undefined,
            })),
        })
    }

    applyPageSeo({
        title,
        description,
        path,
        keywords: [cat.name, cat.id, `${cat.name}工具`],
        jsonLd,
    })
}

export function useHomeSeo(toolCount?: number) {
    const title = `${SITE.brand} — 免费开发者在线工具箱`
    const description = clipMeta(
        toolCount && toolCount > 0
            ? `${SITE.brand}提供 ${toolCount}+ 款免费纯前端开发者工具：格式化、编解码、安全、生成、代码生成、调试与参考速查。本地处理，数据不出浏览器。`
            : SITE.defaultDescription,
    )

    applyPageSeo({
        title,
        description,
        path: '/',
        jsonLd: [
            {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: SITE.brand,
                alternateName: ['DevCoffer', '码柜'],
                url: SITE.url,
                description,
                inLanguage: SITE.lang,
                potentialAction: {
                    '@type': 'SearchAction',
                    target: `${SITE.url}/?q={search_term_string}`,
                    'query-input': 'required name=search_term_string',
                },
            },
            {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: SITE.brand,
                url: SITE.url,
                description: SITE.defaultDescription,
            },
        ],
    })
}
