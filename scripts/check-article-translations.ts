/**
 * 检查文章翻译数据
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkArticleTranslations() {
  console.log('🔍 检查文章翻译数据\n')
  console.log('─'.repeat(80))

  // 1. 获取所有已发布的文章
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, slug, title, category, status')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (articlesError || !articles) {
    console.error('❌ 获取文章失败:', articlesError)
    return
  }

  console.log(`📊 总共 ${articles.length} 篇已发布文章\n`)

  // 2. 获取所有俄语标题翻译
  const articleIds = articles.map(a => a.id)
  const { data: translations, error: transError } = await supabase
    .from('translations')
    .select('resource_id, field, value')
    .eq('resource_type', 'article')
    .in('resource_id', articleIds)
    .eq('locale', 'ru')
    .eq('field', 'title')

  if (transError) {
    console.error('❌ 获取翻译失败:', transError)
    return
  }

  console.log(`📝 有 ${translations?.length || 0} 篇文章有俄语标题翻译\n`)
  console.log('─'.repeat(80))

  // 3. 创建翻译映射
  const translatedIds = new Set(translations?.map(t => t.resource_id) || [])

  // 4. 显示翻译状态
  console.log('\n已翻译的文章:')
  console.log('─'.repeat(80))
  articles
    .filter(a => translatedIds.has(a.id))
    .forEach((article, index) => {
      const translation = translations?.find(t => t.resource_id === article.id)
      console.log(`${index + 1}. [${article.category}] ${article.slug}`)
      console.log(`   原标题: ${article.title}`)
      console.log(`   俄语标题: ${translation?.value}`)
      console.log()
    })

  console.log('─'.repeat(80))
  console.log('\n未翻译的文章（前10篇）:')
  console.log('─'.repeat(80))
  articles
    .filter(a => !translatedIds.has(a.id))
    .slice(0, 10)
    .forEach((article, index) => {
      console.log(`${index + 1}. [${article.category}] ${article.slug}`)
      console.log(`   ${article.title}`)
      console.log()
    })

  // 5. 按分类统计
  const categoryStats: Record<string, { total: number; translated: number }> = {}

  articles.forEach(article => {
    if (!categoryStats[article.category]) {
      categoryStats[article.category] = { total: 0, translated: 0 }
    }
    categoryStats[article.category].total++
    if (translatedIds.has(article.id)) {
      categoryStats[article.category].translated++
    }
  })

  console.log('─'.repeat(80))
  console.log('\n分类统计:')
  console.log('─'.repeat(80))
  Object.entries(categoryStats).forEach(([category, stats]) => {
    console.log(`${category}: ${stats.translated}/${stats.total} 已翻译`)
  })
}

if (require.main === module) {
  checkArticleTranslations().catch(console.error)
}
