import type { JSX } from 'react'

export const SITE_URL = 'https://bscorner.com'
export const OG_IMAGE_URL = `${SITE_URL}/api/og`
export const SITEMAP_URL = `${SITE_URL}/sitemap.xml`

type JsonLdPrimitive = string | number | boolean | null
export type JsonLdValue = JsonLdPrimitive | JsonLdObject | JsonLdValue[]
export type JsonLdObject = { [key: string]: JsonLdValue | undefined }

export interface PublicSeoOptions {
  title: string
  description: string
  path: string
  jsonLd?: JsonLdObject
}

export interface LeaderboardSeoEntry {
  title: string
}

type SeoMeta = JSX.IntrinsicElements['meta']
type SeoMetaDescriptor =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }
  | { 'script:ld+json': JsonLdObject }

interface SeoHead {
  meta: SeoMeta[]
  links?: JSX.IntrinsicElements['link'][]
}

function canonicalPath(path: string) {
  const pathWithoutQuery = path.split(/[?#]/, 1)[0] || '/'
  return pathWithoutQuery.startsWith('/') ? pathWithoutQuery : `/${pathWithoutQuery}`
}

export function publicSeo({
  title,
  description,
  path,
  jsonLd,
}: PublicSeoOptions) {
  const canonical = `${SITE_URL}${canonicalPath(path)}`
  const meta: SeoMetaDescriptor[] = [
    { title },
    { name: 'description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: OG_IMAGE_URL },
    { property: 'og:image:type', content: 'image/png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: title },
    { property: 'og:url', content: canonical },
    { property: 'og:site_name', content: 'Bullshit Corner' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: OG_IMAGE_URL },
    { name: 'twitter:image:alt', content: title },
  ]

  if (jsonLd) {
    meta.push({ 'script:ld+json': jsonLd })
  }

  return {
    // TanStack Router's React type augmentation currently narrows meta to
    // native <meta> attributes, although its head renderer intentionally
    // supports the script:ld+json descriptor at runtime.
    meta: meta as unknown as SeoMeta[],
    links: [{ rel: 'canonical', href: canonical }],
  } satisfies SeoHead
}

export function privateSeo(title: string) {
  return {
    meta: [
      { title },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }
}

export function leaderboardJsonLd({
  title,
  path,
  entries,
  includeWebsite = false,
}: {
  title: string
  path: string
  entries: readonly LeaderboardSeoEntry[]
  includeWebsite?: boolean
}): JsonLdObject {
  const canonical = `${SITE_URL}${canonicalPath(path)}`
  const itemListId = `${canonical}#item-list`
  const graph: JsonLdObject[] = []

  if (includeWebsite) {
    graph.push({
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Bullshit Corner',
    })
  }

  graph.push(
    {
      '@type': 'CollectionPage',
      '@id': `${canonical}#collection`,
      url: canonical,
      name: title,
      mainEntity: { '@id': itemListId },
    },
    {
      '@type': 'ItemList',
      '@id': itemListId,
      name: title,
      itemListElement: entries.map((entry, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: entry.title,
      })),
    },
  )

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}
