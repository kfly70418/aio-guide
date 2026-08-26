import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'
import { createPublicClient } from '@/lib/supabase/public'

export const revalidate = 3600

function getLatestModified(items: Array<{ updated_at: string | null }> | null | undefined) {
  const timestamps = (items || [])
    .map(item => item.updated_at ? new Date(item.updated_at).getTime() : Number.NaN)
    .filter(Number.isFinite)

  return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined
}

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
    .select('id, slug, updated_at, category')
    .eq('status', 'published')

  // 只有存在有效报价的模型详情页才允许索引。
  const { data: activePrices } = await supabase
    .from('prices')
    .select(`
      model_id,
      channel:channels!inner(
        provider:providers!inner(status)
      )
    `)
    .eq('status', 'active')

  const modelIdsWithPublishedPrices = new Set(
    (activePrices || [])
      .filter(price => price.channel?.provider?.status === 'published')
      .map(price => price.model_id)
  )

  const indexableModels = (models || []).filter(model =>
    modelIdsWithPublishedPrices.has(model.id)
  )
  const indexableArticles = (articles || []).filter(article => article.category !== 'news')

  // 获取所有俄语翻译（检查哪些资源有俄语版本）
  const allResourceIds = [
    ...(providers?.map(p => p.id) || []),
    ...indexableModels.map(model => model.id),
    ...indexableArticles.map(article => article.id)
  ]

  const { data: translations } = await supabase
    .from('translations')
    .select('resource_type, resource_id, field')
    .eq('locale', 'ru')
    .in('resource_id', allResourceIds)

  // 记录每个资源已经存在的翻译字段。
  const translatedFields = new Map<string, Set<string>>()
  translations?.forEach(t => {
    const key = `${t.resource_type}:${t.resource_id}`
    if (!translatedFields.has(key)) {
      translatedFields.set(key, new Set())
    }
    translatedFields.get(key)!.add(t.field)
  })

  const hasFields = (resourceType: string, resourceId: string, fields: string[]) => {
    const availableFields = translatedFields.get(`${resourceType}:${resourceId}`)
    return fields.every(field => availableFields?.has(field))
  }

  const providersLastModified = getLatestModified(providers)
  const modelsLastModified = getLatestModified(indexableModels)
  const articlesLastModified = getLatestModified(indexableArticles)
  const homeLastModified = getLatestModified([
    ...(providers || []),
    ...indexableModels,
    ...indexableArticles,
  ])
  const sitemap: MetadataRoute.Sitemap = []

  // 首页（中文和俄语都存在）
  sitemap.push({
    url: SITE_URL,
    lastModified: homeLastModified,
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
    lastModified: homeLastModified,
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
    lastModified: providersLastModified,
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
    lastModified: providersLastModified,
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
    lastModified: modelsLastModified,
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
    lastModified: modelsLastModified,
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
    lastModified: articlesLastModified,
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
    lastModified: articlesLastModified,
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
    const hasRu = hasFields('provider', provider.id, ['description'])

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
  indexableModels.forEach(model => {
    sitemap.push({
      url: `${SITE_URL}/models/${model.slug}`,
      lastModified: new Date(model.updated_at),
      changeFrequency: 'weekly',
      priority: 0.7
    })
  })

  // 文章详情页
  indexableArticles.forEach(article => {
    const hasRu = hasFields('article', article.id, ['title', 'content'])

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
