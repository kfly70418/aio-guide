import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'
import { createPublicClient } from '@/lib/supabase/public'
import { locales } from '@/lib/i18n/config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient()

  // 获取所有已发布的服务商
  const { data: providers } = await supabase
    .from('providers')
    .select('slug, updated_at')
    .eq('status', 'published')

  // 获取所有已发布的模型
  const { data: models } = await supabase
    .from('models')
    .select('slug, updated_at')
    .eq('status', 'published')

  // 获取所有已发布的文章
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, updated_at')
    .eq('status', 'published')

  const now = new Date()
  const sitemap: MetadataRoute.Sitemap = []

  // 为每个语言版本生成sitemap
  for (const locale of locales) {
    const baseUrl = locale === 'zh' ? SITE_URL : `${SITE_URL}/${locale}`

    // 首页
    sitemap.push({
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
      alternates: {
        languages: locales.reduce((acc, l) => {
          acc[l] = l === 'zh' ? SITE_URL : `${SITE_URL}/${l}`
          return acc
        }, {} as Record<string, string>)
      }
    })

    // 服务商列表页
    sitemap.push({
      url: `${baseUrl}/providers`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: locales.reduce((acc, l) => {
          acc[l] = l === 'zh' ? `${SITE_URL}/providers` : `${SITE_URL}/${l}/providers`
          return acc
        }, {} as Record<string, string>)
      }
    })

    // 模型列表页
    sitemap.push({
      url: `${baseUrl}/models`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: locales.reduce((acc, l) => {
          acc[l] = l === 'zh' ? `${SITE_URL}/models` : `${SITE_URL}/${l}/models`
          return acc
        }, {} as Record<string, string>)
      }
    })

    // 文章列表页
    sitemap.push({
      url: `${baseUrl}/articles`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
      alternates: {
        languages: locales.reduce((acc, l) => {
          acc[l] = l === 'zh' ? `${SITE_URL}/articles` : `${SITE_URL}/${l}/articles`
          return acc
        }, {} as Record<string, string>)
      }
    })

    // 每个服务商详情页
    providers?.forEach(provider => {
      sitemap.push({
        url: `${baseUrl}/providers/${provider.slug}`,
        lastModified: new Date(provider.updated_at),
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: {
          languages: locales.reduce((acc, l) => {
            acc[l] = l === 'zh'
              ? `${SITE_URL}/providers/${provider.slug}`
              : `${SITE_URL}/${l}/providers/${provider.slug}`
            return acc
          }, {} as Record<string, string>)
        }
      })
    })

    // 每个模型详情页
    models?.forEach(model => {
      sitemap.push({
        url: `${baseUrl}/models/${model.slug}`,
        lastModified: new Date(model.updated_at),
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: {
          languages: locales.reduce((acc, l) => {
            acc[l] = l === 'zh'
              ? `${SITE_URL}/models/${model.slug}`
              : `${SITE_URL}/${l}/models/${model.slug}`
            return acc
          }, {} as Record<string, string>)
        }
      })
    })

    // 每篇文章详情页
    articles?.forEach(article => {
      sitemap.push({
        url: `${baseUrl}/articles/${article.slug}`,
        lastModified: new Date(article.updated_at),
        changeFrequency: 'monthly',
        priority: 0.6,
        alternates: {
          languages: locales.reduce((acc, l) => {
            acc[l] = l === 'zh'
              ? `${SITE_URL}/articles/${article.slug}`
              : `${SITE_URL}/${l}/articles/${article.slug}`
            return acc
          }, {} as Record<string, string>)
        }
      })
    })

    // 静态页面
    const staticPages = ['about', 'methodology', 'terms', 'privacy']
    staticPages.forEach(page => {
      sitemap.push({
        url: `${baseUrl}/${page}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
        alternates: {
          languages: locales.reduce((acc, l) => {
            acc[l] = l === 'zh' ? `${SITE_URL}/${page}` : `${SITE_URL}/${l}/${page}`
            return acc
          }, {} as Record<string, string>)
        }
      })
    })
  }

  return sitemap
}
