/**
 * 获取单篇文章内容
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getArticle(articleId: string) {
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, title, summary, content')
    .eq('id', articleId)
    .single()

  if (error || !data) {
    console.error('❌ 获取失败:', error?.message)
    process.exit(1)
  }

  console.log('📄 文章信息')
  console.log('─'.repeat(60))
  console.log(`标题: ${data.title}`)
  console.log(`简介: ${data.summary}`)
  console.log(`字数: ${data.content.length} 字符`)
  console.log('─'.repeat(60))
  console.log('\n内容:\n')
  console.log(data.content)
}

const articleId = process.argv[2]

if (!articleId) {
  console.error('用法: npx tsx scripts/get-article.ts <文章ID>')
  process.exit(1)
}

getArticle(articleId).catch(console.error)
