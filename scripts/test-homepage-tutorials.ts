/**
 * 测试首页教程数据获取
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

async function getTranslatedArticles(locale: string, options?: {
  limit?: number
  category?: 'tutorial' | 'guide' | 'news' | 'faq'
}) {
  console.log(`\n[getTranslatedArticles] 参数: locale=${locale}, category=${options?.category}, limit=${options?.limit}`)

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

  console.log(`[查询结果] ${articles?.length || 0} 篇文章`)

  if (error) {
    console.error('[错误]', error)
    return []
  }

  if (!articles || articles.length === 0) {
    console.log('[返回] 空数组')
    return []
  }

  if (locale !== 'zh') {
    const articleIds = articles.map(a => a.id)
    const translationsMap = await getBatchTranslations('article', articleIds, locale)

    console.log(`[翻译数据] ${translationsMap.size} 篇文章有翻译`)

    const translatedArticles = articles
      .filter(article => {
        const translations = translationsMap.get(article.id)
        const hasTitle = translations && translations.title
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

    console.log(`[过滤后] ${translatedArticles.length} 篇文章`)
    return translatedArticles
  }

  console.log(`[中文] 直接返回 ${articles.length} 篇文章`)
  return articles
}

async function testHomePage() {
  console.log('🔍 测试首页教程数据获取\n')
  console.log('='.repeat(80))

  const tutorials = await getTranslatedArticles('ru', { category: 'tutorial', limit: 6 })

  console.log('\n' + '='.repeat(80))
  console.log(`\n✅ 最终结果: ${tutorials.length} 篇教程`)

  if (tutorials.length > 0) {
    console.log('\n教程列表:')
    tutorials.forEach((t, i) => {
      console.log(`${i + 1}. ${t.title}`)
    })
  } else {
    console.log('\n⚠️  没有教程数据 - 首页将不显示教程区块')
  }

  console.log('\n首页代码中的条件判断:')
  console.log(`tutorials && tutorials.length > 0: ${tutorials && tutorials.length > 0}`)
  console.log(`如果为 false，教程区块将不会渲染`)
}

if (require.main === module) {
  testHomePage().catch(console.error)
}
