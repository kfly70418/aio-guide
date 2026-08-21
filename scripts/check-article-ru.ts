import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkArticle() {
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, title, title_ru, content, content_ru')
    .eq('slug', 'api-key-leak-emergency-response')
    .single()

  if (error) {
    console.log('❌ 错误:', error.message)
    return
  }

  console.log('📄 文章数据检查\n')
  console.log('Slug:', data.slug)
  console.log('中文标题:', data.title)
  console.log('俄语标题:', data.title_ru || '❌ 未找到')
  console.log('\n中文内容长度:', data.content?.length || 0)
  console.log('俄语内容长度:', data.content_ru?.length || 0)
  console.log('\n中文内容预览:', data.content?.substring(0, 100))
  console.log('\n俄语内容预览:', data.content_ru?.substring(0, 100) || '❌ 未找到')
}

checkArticle()
