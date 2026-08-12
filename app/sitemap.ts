import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/constants'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const [{ data: providers }, { data: articles }] = await Promise.all([
    supabase
      .from('providers')
      .select('slug, updated_at, description')
      .eq('status', 'published'),
    supabase
      .from('articles')
      .select('slug, updated_at')
      .eq('status', 'published'),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/providers`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/articles`, changeFrequency: 'weekly', priority: 0.8 },
  ]

  // 质量门槛：详情页必须有简介才收录
  const providerPages: MetadataRoute.Sitemap = (providers ?? [])
    .filter((p) => p.description && p.description.trim().length >= 20)
    .map((p) => ({
      url: `${SITE_URL}/providers/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  const articlePages: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: `${SITE_URL}/articles/${a.slug}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...providerPages, ...articlePages]
}
