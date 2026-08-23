/**
 * 测试线上 API 是否返回正确数据
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // 使用 anon key 模拟线上环境
)

async function testPublicAPI() {
  console.log('🔍 测试使用公开 API（模拟线上环境）\n')
  console.log('─'.repeat(80))

  const locale = 'ru'
  const category = 'tutorial'

  // 1. 获取文章（和线上代码完全一样的查询）
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

  // 3. 检查每篇文章的翻译情况
  console.log('\n详细翻译情况:')
  console.log('─'.repeat(80))

  const translationsByArticle = new Map<string, any[]>()
  translations?.forEach(t => {
    if (!translationsByArticle.has(t.resource_id)) {
      translationsByArticle.set(t.resource_id, [])
    }
    translationsByArticle.get(t.resource_id)!.push(t)
  })

  let hasTitle = 0
  let hasSummary = 0
  let hasContent = 0

  articles.forEach((article, i) => {
    const trans = translationsByArticle.get(article.id) || []
    const titleTrans = trans.find(t => t.field === 'title')
    const summaryTrans = trans.find(t => t.field === 'summary')
    const contentTrans = trans.find(t => t.field === 'content')

    if (titleTrans) hasTitle++
    if (summaryTrans) hasSummary++
    if (contentTrans) hasContent++

    console.log(`${i + 1}. ${article.slug}`)
    console.log(`   Title: ${titleTrans ? '✅' : '❌'}`)
    console.log(`   Summary: ${summaryTrans ? '✅' : '❌'}`)
    console.log(`   Content: ${contentTrans ? '✅' : '❌'}`)
    if (titleTrans) {
      console.log(`   俄语标题: ${titleTrans.value}`)
    }
    console.log()
  })

  console.log('─'.repeat(80))
  console.log(`\n统计:`)
  console.log(`有 title 翻译: ${hasTitle}/${articles.length}`)
  console.log(`有 summary 翻译: ${hasSummary}/${articles.length}`)
  console.log(`有 content 翻译: ${hasContent}/${articles.length}`)

  // 4. 模拟过滤逻辑
  const translationsMap = new Map<string, Record<string, string>>()
  translations?.forEach((t: any) => {
    if (!translationsMap.has(t.resource_id)) {
      translationsMap.set(t.resource_id, {})
    }
    translationsMap.get(t.resource_id)![t.field] = t.value
  })

  const filtered = articles.filter(article => {
    const trans = translationsMap.get(article.id)
    return trans && trans.title
  })

  console.log(`\n✅ 过滤后应该显示 ${filtered.length} 篇文章`)
}

if (require.main === module) {
  testPublicAPI().catch(console.error)
}
