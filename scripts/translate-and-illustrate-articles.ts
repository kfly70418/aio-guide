/**
 * 翻译文章详情内容 + 生成俄语配图
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: 'https://api.api666666.org/v1',
})

interface Article {
  id: string
  slug: string
  title: string
  content: string
}

async function translateContent(content: string, title: string): Promise<string> {
  console.log('  翻译内容...')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `你是专业的技术文档翻译专家。将中文技术文章翻译成地道的俄语，保持：
1. Markdown 格式完整（标题、代码块、列表等）
2. 技术术语准确（API、Token、Base URL等保持英文）
3. 代码示例不翻译
4. 语气专业、简洁、实用`,
      },
      {
        role: 'user',
        content: `请将以下文章翻译成俄语：

标题：${title}

内容：
${content}`,
      },
    ],
    temperature: 0.3,
  })

  return response.choices[0]?.message?.content || ''
}

async function generateImage(title: string, summary: string): Promise<string> {
  console.log('  生成配图...')

  const prompt = `Create a clean, professional illustration for a technical tutorial article.
Theme: ${title}
Context: ${summary}

Style requirements:
- Modern, minimalist design
- Tech-focused imagery (API, code, cloud computing)
- Color scheme: Blue and white with orange accents
- No text in the image
- Professional and educational tone
- Suitable for a tech blog header`

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1792x1024',
    quality: 'standard',
  })

  return response.data?.[0]?.url || ''
}

async function downloadImage(url: string, slug: string): Promise<string> {
  console.log('  下载图片...')

  const response = await fetch(url)
  const buffer = await response.arrayBuffer()

  const filename = `${slug}-ru.png`
  const filepath = path.join(__dirname, '../public/images/articles', filename)

  // 确保目录存在
  const dir = path.dirname(filepath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(filepath, Buffer.from(buffer))

  return `/images/articles/${filename}`
}

async function processArticle(article: Article, index: number, total: number) {
  console.log(`\n[${index + 1}/${total}] 处理: ${article.title}`)
  console.log('─'.repeat(60))

  try {
    // 1. 翻译内容
    const translatedContent = await translateContent(article.content, article.title)

    // 2. 保存翻译
    const { error: transError } = await supabase
      .from('translations')
      .upsert({
        resource_type: 'article',
        resource_id: article.id,
        locale: 'ru',
        field: 'content',
        value: translatedContent,
      }, {
        onConflict: 'resource_type,resource_id,locale,field',
      })

    if (transError) {
      console.error('  ❌ 翻译保存失败:', transError.message)
      return { success: false, hasImage: false }
    }

    console.log('  ✅ 翻译已保存')

    // 3. 生成配图
    try {
      const { data: existingArticle } = await supabase
        .from('articles')
        .select('cover_image_url_ru')
        .eq('id', article.id)
        .single()

      if (existingArticle?.cover_image_url_ru) {
        console.log('  ⏭️  配图已存在，跳过')
        return { success: true, hasImage: true }
      }

      const imageUrl = await generateImage(article.title, article.content.substring(0, 300))
      const localPath = await downloadImage(imageUrl, article.slug)

      // 4. 保存图片路径
      const { error: imageError } = await supabase
        .from('articles')
        .update({ cover_image_url_ru: localPath })
        .eq('id', article.id)

      if (imageError) {
        console.error('  ⚠️  图片路径保存失败:', imageError.message)
        return { success: true, hasImage: false }
      }

      console.log('  ✅ 配图已生成:', localPath)
      return { success: true, hasImage: true }

    } catch (imageError: any) {
      console.error('  ⚠️  配图生成失败:', imageError.message)
      return { success: true, hasImage: false }
    }

  } catch (error: any) {
    console.error('  ❌ 处理失败:', error.message)
    return { success: false, hasImage: false }
  }
}

async function main() {
  console.log('📝 开始翻译文章详情并生成配图\n')
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

  console.log(`📊 共 ${articles.length} 篇教程需要处理\n`)

  let successCount = 0
  let failCount = 0
  let imageCount = 0

  for (let i = 0; i < articles.length; i++) {
    const result = await processArticle(articles[i], i, articles.length)

    if (result.success) {
      successCount++
      if (result.hasImage) imageCount++
    } else {
      failCount++
    }

    // 避免频率限制
    if (i < articles.length - 1) {
      console.log('\n  ⏱️  等待 5 秒...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`✅ 处理完成`)
  console.log(`📊 成功: ${successCount}，失败: ${failCount}`)
  console.log(`🖼️  配图: ${imageCount}`)
}

if (require.main === module) {
  main().catch(console.error)
}
