import type {SitemapUrlInput} from '#sitemap/types'
import {categories, tools} from '~/data/tools'

export default defineSitemapEventHandler(() => {
    const lastmod = new Date().toISOString()
    const urls: SitemapUrlInput[] = [
        {
            loc: '/',
            lastmod,
            changefreq: 'daily',
            priority: 1,
        },
    ]

    for (const cat of categories) {
        if (cat.virtual) continue
        urls.push({
            loc: `/c/${cat.id}`,
            lastmod,
            changefreq: 'weekly',
            priority: 0.8,
        })
    }

    for (const tool of tools) {
        urls.push({
            loc: `/t/${tool.id}`,
            lastmod,
            changefreq: 'weekly',
            priority: 0.7,
        })
    }

    return urls
})
