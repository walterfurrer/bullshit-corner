// @vitest-environment node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  leaderboardJsonLd,
  privateSeo,
  publicSeo,
  SITE_URL,
} from './seo'

type TestMeta = Record<string, unknown>

function metaWith(head: ReturnType<typeof publicSeo>, key: string, value: string) {
  return (head.meta as TestMeta[]).find((meta) => meta[key] === value)
}

describe('public SEO metadata', () => {
  const pages = [
    {
      title: 'Formula 1 Hot Takes Ranked | Bullshit Corner',
      description:
        'Browse the official High Performance Racing Bullshit Corner leaderboard, compare Formula 1 hot takes, and submit yours for a future episode.',
      path: '/',
    },
    {
      title: 'Community Formula 1 Rankings | Bullshit Corner',
      description:
        'See how Formula 1 fans rank the current Bullshit Corner topics, then sign in to add your own leaderboard.',
      path: '/community',
    },
    {
      title: 'Submit a Formula 1 Hot Take | Bullshit Corner',
      description:
        'Send a Formula 1 hot take to Bullshit Corner for possible debate on a future High Performance Racing episode.',
      path: '/submit-topic',
    },
  ] as const

  it.each(pages)('builds complete metadata for $path', (page) => {
    const head = publicSeo(page)
    const canonical = `${SITE_URL}${page.path}`
    const metas = head.meta as TestMeta[]

    expect(metas).toContainEqual({ title: page.title })
    expect(metas).toContainEqual({ name: 'description', content: page.description })
    expect(metaWith(head, 'property', 'og:url')).toMatchObject({ content: canonical })
    expect(metaWith(head, 'name', 'twitter:image')).toMatchObject({
      content: 'https://bscorner.com/api/og',
    })
    expect(metaWith(head, 'property', 'og:image:type')).toMatchObject({ content: 'image/png' })
    expect(metaWith(head, 'property', 'og:image:width')).toMatchObject({ content: '1200' })
    expect(metaWith(head, 'property', 'og:image:height')).toMatchObject({ content: '630' })
    expect(head.links).toEqual([{ rel: 'canonical', href: canonical }])
  })

  it('canonicalizes query-string variants to the clean route', () => {
    const head = publicSeo({
      title: pages[1].title,
      description: pages[1].description,
      path: '/community?sort=popular',
    })

    expect(head.links).toEqual([
      { rel: 'canonical', href: 'https://bscorner.com/community' },
    ])
    expect(metaWith(head, 'property', 'og:url')).toMatchObject({
      content: 'https://bscorner.com/community',
    })
  })
})

describe('private SEO metadata', () => {
  it('marks private pages noindex and nofollow', () => {
    expect(privateSeo('Settings | Bullshit Corner')).toEqual({
      meta: [
        { title: 'Settings | Bullshit Corner' },
        { name: 'robots', content: 'noindex, nofollow' },
      ],
    })
  })
})

describe('leaderboard JSON-LD', () => {
  it('includes truthful ordered names from loader data', () => {
    const jsonLd = leaderboardJsonLd({
      title: 'Formula 1 Hot Takes: The Bullshit Corner Leaderboard',
      path: '/',
      includeWebsite: true,
      entries: [{ title: 'Ferrari strategy' }, { title: 'DRS trains' }],
    })
    const graph = jsonLd['@graph'] as TestMeta[]
    const itemList = graph.find((item) => item['@type'] === 'ItemList')!

    expect(graph.map((item) => item['@type'])).toEqual([
      'WebSite',
      'CollectionPage',
      'ItemList',
    ])
    expect(itemList.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Ferrari strategy' },
      { '@type': 'ListItem', position: 2, name: 'DRS trains' },
    ])
    expect(JSON.stringify(jsonLd)).not.toContain('Organization')
    expect(JSON.stringify(jsonLd)).not.toContain('PodcastSeries')
  })
})

describe('crawl discovery files', () => {
  const publicRoot = resolve(process.cwd(), 'public')

  it('allows crawling and declares the sitemap', () => {
    const robots = readFileSync(resolve(publicRoot, 'robots.txt'), 'utf8')

    expect(robots).toContain('User-agent: *')
    expect(robots).toContain('Allow: /')
    expect(robots).toContain('Sitemap: https://bscorner.com/sitemap.xml')
    expect(robots).not.toContain('Disallow:')
  })

  it('contains exactly the three public URLs', () => {
    const sitemap = readFileSync(resolve(publicRoot, 'sitemap.xml'), 'utf8')
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])

    expect(urls).toEqual([
      'https://bscorner.com/',
      'https://bscorner.com/community',
      'https://bscorner.com/submit-topic',
    ])
    expect(sitemap).not.toContain('lastmod')
    expect(sitemap).not.toContain('/api/')
    expect(sitemap).not.toContain('/admin')
    expect(sitemap).not.toContain('/sign-in')
    expect(sitemap).not.toContain('/sign-up')
  })
})
