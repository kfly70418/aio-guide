import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkSchema() {
  console.log('🔍 检查 articles 表结构...\n')

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .limit(1)

  if (error) {
    console.log('❌ 错误:', error.message)
    return
  }

  if (data && data.length > 0) {
    console.log('📋 当前字段列表:')
    Object.keys(data[0]).forEach(key => {
      console.log(`  - ${key}`)
    })

    console.log('\n❓ 检查俄语字段:')
    console.log('  title_ru:', 'title_ru' in data[0] ? '✅ 存在' : '❌ 不存在')
    console.log('  summary_ru:', 'summary_ru' in data[0] ? '✅ 存在' : '❌ 不存在')
    console.log('  content_ru:', 'content_ru' in data[0] ? '✅ 存在' : '❌ 不存在')
    console.log('  cover_image_url_ru:', 'cover_image_url_ru' in data[0] ? '✅ 存在' : '❌ 不存在')
  }
}

checkSchema()
