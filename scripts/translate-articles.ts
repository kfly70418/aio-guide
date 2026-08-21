/**
 * 翻译文章标题和摘要到俄语
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

async function translateText(text: string, context: string = ''): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `请将以下${context}从中文翻译成俄语，保持专业性和准确性：\n\n${text}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type === 'text') {
    return content.text.trim()
  }
  throw new Error('Unexpected response type')
}

async function translateArticles() {
  console.log('📝 开始翻译文章到俄语\n')
  console.log('─'.repeat(60))

  // 获取所有已发布的文章
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, slug, title, summary, category')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error || !articles) {
    console.error('❌ 获取文章失败:', error)
    return
  }

  console.log(`📊 共 ${articles.length} 篇文章需要翻译\n`)

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]
    console.log(`[${i + 1}/${articles.length}] 翻译: ${article.title}`)

    try {
      // 翻译标题
      const titleRu = await translateText(article.title, '文章标题')
      console.log(`  ✅ 标题: ${titleRu}`)

      await new Promise(resolve => setTimeout(resolve, 500))

      // 翻译摘要
      let summaryRu = ''
      if (article.summary) {
        summaryRu = await translateText(article.summary, '文章摘要')
        console.log(`  ✅ 摘要: ${summaryRu.substring(0, 50)}...`)
      }

      // 保存翻译
      const translations = [
        {
          resource_type: 'article',
          resource_id: article.id,
          locale: 'ru',
          field: 'title',
          value: titleRu,
        },
      ]

      if (summaryRu) {
        translations.push({
          resource_type: 'article',
          resource_id: article.id,
          locale: 'ru',
          field: 'summary',
          value: summaryRu,
        })
      }

      const { error: insertError } = await supabase
        .from('translations')
        .upsert(translations, {
          onConflict: 'resource_type,resource_id,locale,field',
        })

      if (insertError) {
        console.error('  ❌ 保存失败:', insertError.message)
        failCount++
      } else {
        successCount++
      }

      // API 限流
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error: any) {
      console.error(`  ❌ 翻译失败:`, error.message)
      failCount++
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`✅ 翻译完成`)
  console.log(`📊 成功: ${successCount}，失败: ${failCount}`)
}

if (require.main === module) {
  translateArticles().catch(console.error)
}
