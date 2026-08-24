import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'
import { createPublicClient } from '@/lib/supabase/public'
import { locales } from '@/lib/i18n/config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient()

  // 获取所有已发布的服务商
  const { data: providers } = await supabase
    .from('providers')
    .select('id, slug, updated_at')
    .eq('status', 'published')

  // 获取所有已发布的模型
  const { data: models } = await supabase
    .from('models')
    .select('id, slug, updated_at')
    .eq('status', 'published')

  // 获取所有已发布的文章
  const { data: articles } = await supabase
    .from('articles')
    .select('id, slug, updated_at')
    .eq('status', 'published')

  // 获取所有俄语翻译（检查哪些资源有俄语版本）
  const allResourceIds = [
    ...(providers?.map(p => p.id) || []),
    ...(models?.map(m => m.id) || []),
    ...(articles?.map(a => a.id) || [])
  ]

  const { data: translations } = await supabase
    .from('translations')
    .select('resource_type, resource_id, field')
    .eq('locale', 'ru')
    .in('resource_id', allResourceIds)

  // 创建翻译映射：哪些资源有俄语标题翻译
  const hasRuTranslation = new Map<string, Set<string>>()
  translations?.forEach(t => {
    if (t.field === 'title' || t.field === 'name') {
      if (!hasRuTranslation.has(t.resource_type)) {
        hasRuTranslation.set(t.resource_type, new Set())
      }
      hasRuTranslation.get(t.resource_type)!.add(t.resource_id)
    }
  })

  const now = new Date()
  const sitemap: MetadataRoute.Sitemap = []

  // 首页（中文和俄语都存在）
  sitemap.push({
    url: SITE_URL,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 1,
    alternates: {
      languages: {
        zh: SITE_URL,
        ru: `${SITE_URL}/ru`
      }
    }
  })

  sitemap.push({
    url: `${SITE_URL}/ru`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 1,
    alternates: {
      languages: {
        zh: SITE_URL,
        ru: `${SITE_URL}/ru`
      }
    }
  })

  // 服务商列表页（中文和俄语都存在）
  sitemap.push({
    url: `${SITE_URL}/providers`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.9,
    alternates: {
      languages: {
        zh: `${SITE_URL}/providers`,
        ru: `${SITE_URL}/ru/providers`
      }
    }
  })

  sitemap.push({
    url: `${SITE_URL}/ru/providers`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.9,
    alternates: {
      languages: {
        zh: `${SITE_URL}/providers`,
        ru: `${SITE_URL}/ru/providers`
      }
    }
  })

  // 模型列表页（中文和俄语都存在）
  sitemap.push({
    url: `${SITE_URL}/models`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.9,
    alternates: {
      languages: {
        zh: `${SITE_URL}/models`,
        ru: `${SITE_URL}/ru/models`
      }
    }
  })

  sitemap.push({
    url: `${SITE_URL}/ru/models`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.9,
    alternates: {
      languages: {
        zh: `${SITE_URL}/models`,
        ru: `${SITE_URL}/ru/models`
      }
    }
  })

  // 文章列表页（中文和俄语都存在）
  sitemap.push({
    url: `${SITE_URL}/articles`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
    alternates: {
      languages: {
        zh: `${SITE_URL}/articles`,
        ru: `${SITE_URL}/ru/articles`
      }
    }
  })

  sitemap.push({
    url: `${SITE_URL}/ru/articles`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
    alternates: {
      languages: {
        zh: `${SITE_URL}/articles`,
        ru: `${SITE_URL}/ru/articles`
      }
    }
  })

  // 服务商详情页
  providers?.forEach(provider => {
    const hasRu = hasRuTranslation.get('provider')?.has(provider.id)

    // 中文版本（总是存在）
    sitemap.push({
      url: `${SITE_URL}/providers/${provider.slug}`,
      lastModified: new Date(provider.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: hasRu ? {
        languages: {
          zh: `${SITE_URL}/providers/${provider.slug}`,
          ru: `${SITE_URL}/ru/providers/${provider.slug}`
        }
      } : undefined
    })

    // 俄语版本（只有有翻译时才添加）
    if (hasRu) {
      sitemap.push({
        url: `${SITE_URL}/ru/providers/${provider.slug}`,
        lastModified: new Date(provider.updated_at),
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: {
          languages: {
            zh: `${SITE_URL}/providers/${provider.slug}`,
            ru: `${SITE_URL}/ru/providers/${provider.slug}`
          }
        }
      })
    }
  })

  // 模型详情页（暂时只添加中文版本，因为俄语模型详情页路由不存在）
  models?.forEach(model => {
    sitemap.push({
      url: `${SITE_URL}/models/${model.slug}`,
      lastModified: new Date(model.updated_at),
      changeFrequency: 'weekly',
      priority: 0.7
    })
  })

  // 文章详情页
  articles?.forEach(article => {
    const hasRu = hasRuTranslation.get('article')?.has(article.id)

    // 中文版本（总是存在）
    sitemap.push({
      url: `${SITE_URL}/articles/${article.slug}`,
      lastModified: new Date(article.updated_at),
      changeFrequency: 'monthly',
      priority: 0.6,
      alternates: hasRu ? {
        languages: {
          zh: `${SITE_URL}/articles/${article.slug}`,
          ru: `${SITE_URL}/ru/articles/${article.slug}`
        }
      } : undefined
    })

    // 俄语版本（只有有翻译时才添加）
    if (hasRu) {
      sitemap.push({
        url: `${SITE_URL}/ru/articles/${article.slug}`,
        lastModified: new Date(article.updated_at),
        changeFrequency: 'monthly',
        priority: 0.6,
        alternates: {
          languages: {
            zh: `${SITE_URL}/articles/${article.slug}`,
            ru: `${SITE_URL}/ru/articles/${article.slug}`
          }
        }
      })
    }
  })

  // 静态页面 - 只添加真实存在的页面
  const existingStaticPages = [
    { slug: 'about', hasRu: true },
    { slug: 'methodology', hasRu: true },
    { slug: 'disclosure', hasRu: true }
    // terms 和 privacy 暂时不添加，因为页面不存在
  ]

  existingStaticPages.forEach(page => {
    // 中文版本
    sitemap.push({
      url: `${SITE_URL}/${page.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
      alternates: page.hasRu ? {
        languages: {
          zh: `${SITE_URL}/${page.slug}`,
          ru: `${SITE_URL}/ru/${page.slug}`
        }
      } : undefined
    })

    // 俄语版本
    if (page.hasRu) {
      sitemap.push({
        url: `${SITE_URL}/ru/${page.slug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
        alternates: {
          languages: {
            zh: `${SITE_URL}/${page.slug}`,
            ru: `${SITE_URL}/ru/${page.slug}`
          }
        }
      })
    }
  })

  return sitemap
}
