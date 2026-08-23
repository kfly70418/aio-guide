/**
 * 测试文章翻译获取逻辑
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testGetTranslatedArticles() {
  console.log('🔍 测试获取翻译文章的逻辑\n')
  console.log('─'.repeat(80))

  const locale = 'ru'
  const category = 'tutorial'

  // 1. 获取文章
  let query = supabase
    .from('articles')
    .select('id, slug, title, summary, category, published_at, view_count')
    .eq('status', 'published')

  if (category) {
    query = query.eq('category', category)
  }

  query = query.order('published_at', { ascending: false }).limit(50)

  const { data: articles, error } = await query

  console.log(`📊 查询到 ${articles?.length || 0} 篇 ${category} 文章`)

  if (error) {
    console.error('❌ 查询文章失败:', error)
    return
  }

  if (!articles || articles.length === 0) {
    console.log('⚠️  没有找到文章')
    return
  }

  console.log('\n文章列表:')
  articles.forEach((a, i) => {
    console.log(`${i + 1}. ${a.slug} - ${a.title}`)
  })

  // 2. 获取翻译
  const articleIds = articles.map(a => a.id)
  console.log(`\n📝 获取 ${articleIds.length} 篇文章的俄语翻译...`)

  const { data: translations, error: transError } = await supabase
    .from('translations')
    .select('resource_id, field, value')
    .eq('resource_type', 'article')
    .in('resource_id', articleIds)
    .eq('locale', locale)

  console.log(`📝 查询到 ${translations?.length || 0} 条翻译记录`)

  if (transError) {
    console.error('❌ 查询翻译失败:', transError)
    return
  }

  // 3. 按 resource_id 分组
  const translationsMap = new Map<string, Record<string, string>>()

  translations?.forEach((t: any) => {
    if (!translationsMap.has(t.resource_id)) {
      translationsMap.set(t.resource_id, {})
    }
    translationsMap.get(t.resource_id)![t.field] = t.value
  })

  console.log(`\n📊 ${translationsMap.size} 篇文章有翻译数据`)

  // 4. 过滤和映射
  const translatedArticles = articles
    .filter(article => {
      const trans = translationsMap.get(article.id)
      const hasTitle = trans && trans.title
      if (!hasTitle) {
        console.log(`⚠️  文章 ${article.slug} 没有 title 翻译`)
      }
      return hasTitle
    })
    .map(article => {
      const trans = translationsMap.get(article.id)!
      return {
        ...article,
        title: trans.title || article.title,
        summary: trans.summary || article.summary,
      }
    })

  console.log(`\n✅ 最终返回 ${translatedArticles.length} 篇已翻译文章`)

  console.log('\n翻译后的文章:')
  console.log('─'.repeat(80))
  translatedArticles.forEach((a, i) => {
    console.log(`${i + 1}. ${a.slug}`)
    console.log(`   原标题: ${articles.find(art => art.id === a.id)?.title}`)
    console.log(`   俄语标题: ${a.title}`)
    console.log()
  })
}

if (require.main === module) {
  testGetTranslatedArticles().catch(console.error)
}
