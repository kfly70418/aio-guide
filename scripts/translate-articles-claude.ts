/**
 * 使用 Claude AI 翻译文章详情内容
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Article {
  id: string
  slug: string
  title: string
  content: string
}

async function main() {
  console.log('📝 开始检查需要翻译的文章\n')
  console.log('─'.repeat(60))

  // 获取所有教程文章
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, slug, title, content')
    .eq('status', 'published')
    .eq('category', 'tutorial')
    .order('published_at', { ascending: false })

  if (error || !articles || articles.length === 0) {
    console.error('❌ 获取文章失败:', error?.message)
    return
  }

  console.log(`📊 共 ${articles.length} 篇教程文章\n`)

  // 检查每篇文章的翻译状态
  for (const article of articles) {
    const { data: translation } = await supabase
      .from('translations')
      .select('value')
      .eq('resource_type', 'article')
      .eq('resource_id', article.id)
      .eq('locale', 'ru')
      .eq('field', 'content')
      .single()

    const status = translation ? '✅ 已翻译' : '❌ 未翻译'
    console.log(`${status} - ${article.title}`)
    console.log(`   ID: ${article.id}`)
    console.log(`   字数: ${article.content.length} 字符\n`)
  }

  console.log('─'.repeat(60))
  console.log('\n💡 请在 Claude Code 中手动执行翻译')
  console.log('   我会为每篇文章提供翻译并保存到数据库\n')
}

if (require.main === module) {
  main().catch(console.error)
}
