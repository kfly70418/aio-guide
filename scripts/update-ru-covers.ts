import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 文章 slug 到 ID 的映射
const articleMapping = [
  { id: '6ecc1150-7d30-46af-8069-c1e674ef4975', slug: 'api-call-failure-diagnosis' },
  { id: '8d02b8d8-da7c-4c09-aa7d-7c77a11f461b', slug: 'how-to-choose-ai-model-by-task' },
  { id: '9afd0107-230f-4baa-8e94-c6442779ec7c', slug: 'api-key-leak-emergency-response' },
  { id: 'e0c98fee-2440-4322-b753-1a31dd9da184', slug: 'first-time-api-topup-guide' },
  { id: '5afdb6e1-d281-4b72-821c-e8d5a439433b', slug: 'api-configuration-testing-methods' },
  { id: '6fd07daa-c6c8-4042-b162-4efa66fe2df2', slug: 'official-vs-proxy-api-comparison' },
  { id: 'c582d516-b5b7-4f7d-8106-7ca74590b0e3', slug: 'api-connection-failure-guide' },
  { id: 'b5d43d7e-c524-4d22-a06f-2b6a6e5f15fb', slug: 'ai-api-beginner-guide' },
  { id: '4243bc85-b4be-43f4-8446-2008130d4730', slug: 'base-url-model-id-token-explained' },
  { id: '39508f04-0b83-46a9-affe-26c4eaa89e32', slug: 'first-time-api-registration-guide' },
  { id: 'd783bfd2-dc9f-4ab8-b168-d86d45a31d77', slug: 'no-code-ai-api-tutorial' },
  { id: 'd17b6a24-b197-4350-acdc-0f935ea24966', slug: 'api-proxy-explained' },
  { id: '74e8371d-de5c-43dd-bd77-7268a52ead90', slug: 'api-key-security-guide' },
  { id: 'a435c62e-40c9-4d78-a495-f8cc0ead88d1', slug: 'ai-api-pricing-explained' },
  { id: '3e4c6043-981e-4d0f-8cc7-11b598c5a989', slug: 'ai-model-selection-guide' },
]

async function updateRussianCovers() {
  console.log('🚀 开始更新俄语配图链接\n')

  // 1. 首先检查字段是否存在
  console.log('1️⃣ 检查 cover_image_url_ru 字段...')
  const { data: testData, error: testError } = await supabase
    .from('articles')
    .select('id, cover_image_url_ru')
    .limit(1)

  if (testError) {
    console.error('❌ 字段不存在，错误:', testError.message)
    console.log('\n📋 请先在 Supabase Dashboard 的 SQL Editor 中执行:')
    console.log('ALTER TABLE articles ADD COLUMN IF NOT EXISTS cover_image_url_ru TEXT;')
    process.exit(1)
  }

  console.log('✅ 字段存在\n')

  // 2. 检查图片文件是否都存在
  console.log('2️⃣ 检查图片文件...')
  const imagesDir = path.join(process.cwd(), 'public', 'images', 'articles')
  let missingFiles: string[] = []

  for (const article of articleMapping) {
    const filename = `${article.slug}-ru.png`
    const filepath = path.join(imagesDir, filename)
    if (!fs.existsSync(filepath)) {
      missingFiles.push(filename)
    }
  }

  if (missingFiles.length > 0) {
    console.error('❌ 缺少以下图片文件:')
    missingFiles.forEach(f => console.log(`   - ${f}`))
    process.exit(1)
  }

  console.log(`✅ 所有 ${articleMapping.length} 个图片文件存在\n`)

  // 3. 更新数据库
  console.log('3️⃣ 更新数据库记录...\n')
  let successCount = 0
  let errorCount = 0

  for (const article of articleMapping) {
    const coverUrl = `/images/articles/${article.slug}-ru.png`

    const { error } = await supabase
      .from('articles')
      .update({ cover_image_url_ru: coverUrl })
      .eq('id', article.id)

    if (error) {
      console.log(`❌ ${article.slug}: ${error.message}`)
      errorCount++
    } else {
      console.log(`✅ ${article.slug}`)
      successCount++
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📊 更新完成`)
  console.log(`   成功: ${successCount}`)
  console.log(`   失败: ${errorCount}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  if (successCount === articleMapping.length) {
    console.log('🎉 所有俄语配图链接已成功更新！')
  }
}

updateRussianCovers()
