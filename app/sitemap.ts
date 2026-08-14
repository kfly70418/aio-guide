import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { SITE_URL } from '@/lib/constants'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient()

  const [{ data: providers }, { data: articles }, { data: models }] = await Promise.all([
    supabase
      .from('providers')
      .select('slug, updated_at, description')
      .eq('status', 'published'),
    supabase
      .from('articles')
      .select('slug, updated_at, category')
      .eq('status', 'published')
      .neq('category', 'news'), // 排除新闻类文章（内容单薄）
    supabase
      .from('models')
      .select('slug, updated_at'),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/providers`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/models`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/articles`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/methodology`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/disclosure`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  // 移除质量门槛：所有已发布的服务商都收录
  const providerPages: MetadataRoute.Sitemap = (providers ?? [])
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

  const modelPages: MetadataRoute.Sitemap = (models ?? []).map((m) => ({
    url: `${SITE_URL}/models/${m.slug}`,
    lastModified: new Date(m.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...providerPages, ...modelPages, ...articlePages]
}
