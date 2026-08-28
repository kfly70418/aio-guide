/**
 * 服务商数据翻译辅助函数
 */

import { createPublicClient } from '@/lib/supabase/public'
import { getTranslations, applyTranslations, getBatchTranslations, applyBatchTranslations } from '@/lib/i18n/translations'
import type { Locale } from '@/lib/i18n/config'
import { sortProvidersByLocale } from '@/lib/provider-order'

/**
 * 获取带翻译的单个服务商
 */
export async function getTranslatedProvider(providerId: string, locale: Locale) {
  const supabase = createPublicClient()

  const { data: provider, error } = await supabase
    .from('providers')
    .select('*')
    .eq('id', providerId)
    .single()

  if (error || !provider) {
    return null
  }

  // 如果不是中文，应用翻译
  if (locale !== 'zh') {
    const translations = await getTranslations('provider', providerId, locale)
    if (!translations.description?.trim()) {
      return null
    }
    return applyTranslations(provider, translations)
  }

  return provider
}

/**
 * 获取带翻译的服务商列表
 */
export async function getTranslatedProviders(locale: Locale, options?: {
  limit?: number
  offset?: number
  isRecommended?: boolean
}) {
  const supabase = createPublicClient()

  let query = supabase
    .from('providers')
    .select('*')
    .eq('status', 'published')

  if (options?.isRecommended !== undefined) {
    query = query.eq('is_recommended', options.isRecommended)
  }

  query = query.order('sort_order', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data: providers, error } = await query

  if (error || !providers) {
    return []
  }

  // 如果不是中文，批量应用翻译
  if (locale !== 'zh') {
    const providerIds = providers.map(p => p.id)
    const translationsMap = await getBatchTranslations('provider', providerIds, locale)
    const translatedProviders = providers.filter(provider =>
      translationsMap.get(provider.id)?.description?.trim()
    )
    return sortProvidersByLocale(applyBatchTranslations(translatedProviders, translationsMap), locale)
  }

  return sortProvidersByLocale(providers, locale)
}

/**
 * 获取带翻译的单个模型
 */
export async function getTranslatedModel(modelId: string, locale: Locale) {
  const supabase = createPublicClient()

  const { data: model, error } = await supabase
    .from('models')
    .select('*')
    .eq('id', modelId)
    .single()

  if (error || !model) {
    return null
  }

  if (locale !== 'zh') {
    const translations = await getTranslations('model', modelId, locale)
    if (!translations.name?.trim()) {
      return null
    }
    return applyTranslations(model, translations)
  }

  return model
}

/**
 * 获取带翻译的模型列表
 */
export async function getTranslatedModels(locale: Locale, options?: {
  limit?: number
  family?: string
}) {
  const supabase = createPublicClient()

  let query = supabase
    .from('models')
    .select('*')
    .eq('status', 'published')

  if (options?.family) {
    query = query.eq('family', options.family)
  }

  query = query.order('sort_order', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data: models, error } = await query

  if (error || !models) {
    return []
  }

  if (locale !== 'zh') {
    const modelIds = models.map(m => m.id)
    const translationsMap = await getBatchTranslations('model', modelIds, locale)
    // 未完成名称翻译的模型不在俄语页面展示，避免混入中文内容。
    const translatedModels = models.filter(model => translationsMap.get(model.id)?.name?.trim())
    return applyBatchTranslations(translatedModels, translationsMap)
  }

  return models
}

/**
 * 获取带翻译的单篇文章（包含完整内容）
 */
export async function getTranslatedArticle(slug: string, locale: Locale) {
  const supabase = createPublicClient()

  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !article) {
    return null
  }

  if (locale !== 'zh') {
    const translations = await getTranslations('article', article.id, locale)
    if (!translations.title?.trim() || !translations.content?.trim()) {
      return null
    }
    return applyTranslations(article, translations)
  }

  return article
}

/**
 * 获取带翻译的文章列表
 */
export async function getTranslatedArticles(locale: Locale, options?: {
  limit?: number
  category?: 'tutorial' | 'guide' | 'news' | 'faq'
}) {
  const supabase = createPublicClient()

  let query = supabase
    .from('articles')
    .select('id, slug, title, summary, category, published_at, view_count')
    .eq('status', 'published')

  if (options?.category) {
    query = query.eq('category', options.category)
  }

  query = query.order('published_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data: articles, error } = await query

  if (error || !articles) {
    return []
  }

  if (locale !== 'zh') {
    const articleIds = articles.map(a => a.id)
    const translationsMap = await getBatchTranslations('article', articleIds, locale)

    // 标题和正文都存在时才公开俄语文章，避免回退成中文内容。
    const translatedArticles = articles
      .filter(article => {
        const translations = translationsMap.get(article.id)
        return translations?.title?.trim() && translations.content?.trim()
      })
      .map(article => {
        const translations = translationsMap.get(article.id)!
        return {
          ...article,
          title: translations.title || article.title,
          summary: translations.summary || article.summary,
        }
      })

    return translatedArticles
  }

  return articles
}
