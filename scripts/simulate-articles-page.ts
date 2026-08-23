/**
 * 完整模拟文章页面的服务端逻辑
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 复制 getBatchTranslations 逻辑
async function getBatchTranslations(
  resourceType: string,
  resourceIds: string[],
  locale: string
): Promise<Map<string, Record<string, string>>> {
  if (locale === 'zh' || resourceIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('translations')
    .select('resource_id, field, value')
    .eq('resource_type', resourceType)
    .in('resource_id', resourceIds)
    .eq('locale', locale)

  if (error) {
    console.error('批量获取翻译失败:', error)
    return new Map()
  }

  const translationsMap = new Map<string, Record<string, string>>()

  data?.forEach((t: any) => {
    if (!translationsMap.has(t.resource_id)) {
      translationsMap.set(t.resource_id, {})
    }
    translationsMap.get(t.resource_id)![t.field] = t.value
  })

  return translationsMap
}

// 复制 getTranslatedArticles 逻辑
async function getTranslatedArticles(locale: string, options?: {
  limit?: number
  category?: 'tutorial' | 'guide' | 'news' | 'faq'
}) {
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

  console.log(`[getTranslatedArticles] 查询参数: category=${options?.category}, locale=${locale}`)
  console.log(`[getTranslatedArticles] 查询结果: ${articles?.length || 0} 篇文章`)

  if (error) {
    console.error('[getTranslatedArticles] 查询错误:', error)
    return []
  }

  if (!articles) {
    console.log('[getTranslatedArticles] 返回空数组（无数据）')
    return []
  }

  if (locale !== 'zh') {
    const articleIds = articles.map(a => a.id)
    console.log(`[getTranslatedArticles] 非中文locale，获取 ${articleIds.length} 篇文章的翻译`)

    const translationsMap = await getBatchTranslations('article', articleIds, locale)
    console.log(`[getTranslatedArticles] 获取到 ${translationsMap.size} 篇文章的翻译`)

    const translatedArticles = articles
      .filter(article => {
        const translations = translationsMap.get(article.id)
        const hasTitle = translations && translations.title
        if (!hasTitle) {
          console.log(`[getTranslatedArticles] 过滤掉: ${article.slug} (无title翻译)`)
        }
        return hasTitle
      })
      .map(article => {
        const translations = translationsMap.get(article.id)!
        return {
          ...article,
          title: translations.title || article.title,
          summary: translations.summary || article.summary,
        }
      })

    console.log(`[getTranslatedArticles] 过滤后返回 ${translatedArticles.length} 篇文章`)
    return translatedArticles
  }

  console.log(`[getTranslatedArticles] 中文locale，直接返回 ${articles.length} 篇文章`)
  return articles
}

async function simulateArticlesPage() {
  console.log('🔍 完整模拟文章页面逻辑\n')
  console.log('─'.repeat(80))

  const locale = 'ru'
  const category = 'tutorial'

  console.log(`\n模拟参数: locale="${locale}", category="${category}"\n`)
  console.log('─'.repeat(80))

  const articlesList = await getTranslatedArticles(locale, {
    limit: 50,
    category: category as any
  })

  console.log('\n─'.repeat(80))
  console.log(`\n✅ 最终结果: ${articlesList.length} 篇文章`)

  if (articlesList.length > 0) {
    console.log('\n文章列表:')
    articlesList.forEach((article, i) => {
      console.log(`${i + 1}. ${article.slug}`)
      console.log(`   ${article.title}`)
    })
  } else {
    console.log('\n⚠️  返回空列表 - 这就是为什么页面显示"Нет статей"')
  }
}

if (require.main === module) {
  simulateArticlesPage().catch(console.error)
}
