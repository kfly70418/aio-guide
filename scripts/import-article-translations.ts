/**
 * 导入手动翻译的文章到数据库
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function importTranslations() {
  console.log('📝 开始导入文章俄语翻译\n')
  console.log('─'.repeat(60))

  // 读取翻译文件
  const translationsPath = path.join(__dirname, 'article-translations-ru.json')
  const translationsData = JSON.parse(fs.readFileSync(translationsPath, 'utf-8'))

  let successCount = 0
  let failCount = 0

  for (const [slug, translation] of Object.entries(translationsData)) {
    console.log(`导入: ${slug}`)

    try {
      // 获取文章ID
      const { data: article } = await supabase
        .from('articles')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!article) {
        console.log(`  ⚠️  文章不存在，跳过`)
        continue
      }

      // 保存翻译
      const translations = [
        {
          resource_type: 'article',
          resource_id: article.id,
          locale: 'ru',
          field: 'title',
          value: (translation as any).title,
        },
        {
          resource_type: 'article',
          resource_id: article.id,
          locale: 'ru',
          field: 'summary',
          value: (translation as any).summary,
        },
      ]

      const { error: insertError } = await supabase
        .from('translations')
        .upsert(translations, {
          onConflict: 'resource_type,resource_id,locale,field',
        })

      if (insertError) {
        console.error('  ❌ 保存失败:', insertError.message)
        failCount++
      } else {
        console.log(`  ✅ 已导入`)
        successCount++
      }
    } catch (error: any) {
      console.error(`  ❌ 导入失败:`, error.message)
      failCount++
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`✅ 导入完成`)
  console.log(`📊 成功: ${successCount}，失败: ${failCount}`)
}

if (require.main === module) {
  importTranslations().catch(console.error)
}
