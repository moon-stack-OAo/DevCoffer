export default defineNuxtConfig({
    ssr: true,
    compatibilityDate: '2025-01-15',

    modules: ['@nuxtjs/seo'],

    site: {
        url: 'https://tools.livancen.top',
        name: 'DevCoffer · 码柜',
        description:
            'DevCoffer（码柜）—— 免费纯前端开发者工具箱：JSON/YAML/SQL 格式化、编解码、哈希加密、UUID、代码生成等，本地处理，数据不出浏览器。',
        defaultLocale: 'zh-CN',
        indexable: true,
    },

    sitemap: {
        autoLastmod: true,
        exclude: ['/health', '/__cors_proxy', '/c/favorites', '/c/recent'],
        sources: ['/api/__sitemap__/urls'],
    },

    robots: {
        disallow: ['/health', '/__cors_proxy'],
        sitemap: '/sitemap.xml',
    },

    ogImage: {
        enabled: true,
        defaults: {
            width: 1200,
            height: 630,
            alt: 'DevCoffer · 码柜',
        },
    },

    schemaOrg: {
        identity: {
            type: 'Organization',
            name: 'DevCoffer · 码柜',
            url: 'https://tools.livancen.top',
            logo: 'https://tools.livancen.top/favicon.svg',
        },
    },

    seo: {
        meta: {
            themeColor: [
                { content: '#0b1220', media: '(prefers-color-scheme: dark)' },
                { content: '#f4f7fb', media: '(prefers-color-scheme: light)' },
            ],
        },
    },

    nitro: {
        preset: 'node-server',
    },

    // 壳层短缓存；探活与站点地图不缓存错内容
    routeRules: {
        '/': { swr: 3600 },
        '/c/**': { swr: 3600 },
        // 开发期关闭 SWR，避免改壳层后 SSR 缓存与 CSR 不一致
        '/t/**': { swr: process.env.NODE_ENV === 'production' ? 3600 : false },
        '/health': { swr: false },
        '/__cors_proxy': { swr: false, headers: { 'cache-control': 'no-store' } },
    },

    app: {
        head: {
            htmlAttrs: { lang: 'zh-CN' },
            title: 'DevCoffer · 码柜 — 免费开发者在线工具箱',
            titleTemplate: '%s',
            meta: [
                { charset: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                {
                    name: 'description',
                    content:
                        'DevCoffer（码柜）—— 免费纯前端开发者工具箱：JSON/YAML/SQL 格式化、编解码、哈希、UUID 等，本地处理，数据不出浏览器。',
                },
                {
                    name: 'keywords',
                    content:
                        '在线工具,开发者工具,JSON 格式化,Base64,UUID,哈希,编解码,YAML,SQL,纯前端,DevCoffer,码柜',
                },
                { name: 'theme-color', content: '#0b1220' },
                { name: 'application-name', content: 'DevCoffer' },
                { name: 'format-detection', content: 'telephone=no' },
                { name: 'robots', content: 'index,follow,max-image-preview:large' },
                { property: 'og:site_name', content: 'DevCoffer · 码柜' },
                { property: 'og:locale', content: 'zh_CN' },
                { property: 'og:type', content: 'website' },
                { name: 'twitter:card', content: 'summary_large_image' },
            ],
            link: [
                { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
                { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
                { rel: 'manifest', href: '/site.webmanifest' },
            ],
            script: [
                {
                    // 首屏前同步主题，避免闪烁
                    key: 'theme-init',
                    innerHTML:
                        "(function(){try{var t=localStorage.getItem('devcoffer:theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);var m=document.querySelector('meta[name=\"theme-color\"]');if(m)m.setAttribute('content',t==='light'?'#f4f7fb':'#0b1220');}}catch(e){}})();",
                    tagPosition: 'head',
                },
            ],
        },
    },

    css: [
        '~/assets/css/main.css',
        '~/assets/css/cat/shared.css',
        '~/assets/css/cat/format.css',
        '~/assets/css/cat/encode.css',
        '~/assets/css/cat/security.css',
        '~/assets/css/cat/generate.css',
        '~/assets/css/cat/codegen.css',
        '~/assets/css/cat/text.css',
        '~/assets/css/cat/debug.css',
        '~/assets/css/cat/reference.css',
    ],
})
