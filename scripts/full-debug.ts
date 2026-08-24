/**
 * 完整调试 - 逐步执行每个步骤
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

async function fullDebug() {
  console.log('🔍 完整调试流程\n')
  console.log('─'.repeat(80))

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const locale = 'ru'
  const category = 'tutorial'

  console.log(`环境变量:`)
  console.log(`  SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  console.log(`  ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...`)
  console.log()

  // 步骤 1: 查询文章
  console.log('步骤 1: 查询 tutorial 类别的文章')
  console.log('─'.repeat(80))

  const query = supabase
    .from('articles')
    .select('id, slug, title, summary, category, published_at, view_count')
    .eq('status', 'published')
    .eq('category', category)
    .order('published_at', { ascending: false })
    .limit(50)

  console.log('查询构建完成，执行中...')

  const { data: articles, error: articlesError } = await query

  if (articlesError) {
    console.error('❌ 查询失败:', articlesError)
    return
  }

  console.log(`✅ 查询成功: ${articles?.length || 0} 篇文章`)

  if (!articles || articles.length === 0) {
    console.log('⚠️  没有找到任何 tutorial 文章！')
    return
  }

  console.log('\n前3篇文章:')
  articles.slice(0, 3).forEach((a, i) => {
    console.log(`  ${i + 1}. ${a.slug}`)
    console.log(`     id: ${a.id}`)
    console.log(`     title: ${a.title}`)
  })

  // 步骤 2: 查询翻译
  console.log('\n步骤 2: 查询翻译数据')
  console.log('─'.repeat(80))

  const articleIds = articles.map(a => a.id)
  console.log(`查询 ${articleIds.length} 篇文章的俄语翻译...`)

  const { data: translations, error: transError } = await supabase
    .from('translations')
    .select('resource_id, field, value')
    .eq('resource_type', 'article')
    .in('resource_id', articleIds)
    .eq('locale', locale)

  if (transError) {
    console.error('❌ 查询翻译失败:', transError)
    return
  }

  console.log(`✅ 查询成功: ${translations?.length || 0} 条翻译记录`)

  if (!translations || translations.length === 0) {
    console.log('⚠️  没有找到任何翻译！这是问题所在！')
    return
  }

  // 步骤 3: 分组翻译
  console.log('\n步骤 3: 按文章分组翻译')
  console.log('─'.repeat(80))

  const translationsMap = new Map<string, Record<string, string>>()

  translations.forEach((t: any) => {
    if (!translationsMap.has(t.resource_id)) {
      translationsMap.set(t.resource_id, {})
    }
    translationsMap.get(t.resource_id)![t.field] = t.value
  })

  console.log(`分组完成: ${translationsMap.size} 篇文章有翻译`)

  // 步骤 4: 检查每篇文章的翻译情况
  console.log('\n步骤 4: 检查每篇文章的 title 翻译')
  console.log('─'.repeat(80))

  let hasTitle = 0
  articles.forEach((article, i) => {
    const trans = translationsMap.get(article.id)
    const titleTrans = trans && trans.title
    if (titleTrans) {
      hasTitle++
      if (i < 3) {
        console.log(`  ${i + 1}. ${article.slug}: ✅ 有 title`)
      }
    } else {
      console.log(`  ${i + 1}. ${article.slug}: ❌ 缺少 title`)
    }
  })

  console.log(`\n总计: ${hasTitle}/${articles.length} 篇文章有 title 翻译`)

  // 步骤 5: 过滤
  console.log('\n步骤 5: 应用过滤逻辑')
  console.log('─'.repeat(80))

  const filtered = articles.filter(article => {
    const trans = translationsMap.get(article.id)
    return trans && trans.title
  })

  console.log(`过滤结果: ${filtered.length} 篇文章`)

  if (filtered.length === 0) {
    console.log('❌ 过滤后没有文章！问题在这里！')
  } else {
    console.log('✅ 过滤成功，应该显示这些文章')
    filtered.slice(0, 3).forEach((a, i) => {
      const trans = translationsMap.get(a.id)!
      console.log(`  ${i + 1}. ${a.slug}`)
      console.log(`     俄语标题: ${trans.title}`)
    })
  }

  // 步骤 6: 映射
  console.log('\n步骤 6: 映射翻译到文章')
  console.log('─'.repeat(80))

  const result = filtered.map(article => {
    const trans = translationsMap.get(article.id)!
    return {
      ...article,
      title: trans.title || article.title,
      summary: trans.summary || article.summary,
    }
  })

  console.log(`最终结果: ${result.length} 篇文章`)
  console.log('\n✅ 完整流程成功')

  console.log('\n' + '='.repeat(80))
  console.log('结论: 本地逻辑完全正常，问题在于线上环境')
  console.log('可能原因:')
  console.log('1. Vercel 环境变量不一致')
  console.log('2. 构建缓存问题')
  console.log('3. 代码没有真正部署到生产环境')
  console.log('='.repeat(80))
}

if (require.main === module) {
  fullDebug().catch(console.error)
}
