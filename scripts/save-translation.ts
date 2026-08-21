/**
 * 保存单篇文章的俄语翻译
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

async function saveTranslation(articleId: string, translatedContent: string) {
  const { error } = await supabase
    .from('translations')
    .upsert({
      resource_type: 'article',
      resource_id: articleId,
      locale: 'ru',
      field: 'content',
      value: translatedContent,
    }, {
      onConflict: 'resource_type,resource_id,locale,field',
    })

  if (error) {
    console.error('❌ 保存失败:', error.message)
    process.exit(1)
  }

  console.log('✅ 翻译已保存到数据库')
}

// 从文件读取翻译内容
const translationFile = process.argv[2]
const articleId = process.argv[3]

if (!translationFile || !articleId) {
  console.error('用法: npx tsx scripts/save-translation.ts <翻译文件.md> <文章ID>')
  process.exit(1)
}

const translatedContent = fs.readFileSync(translationFile, 'utf-8')

saveTranslation(articleId, translatedContent)
  .then(() => console.log('完成'))
  .catch(console.error)
