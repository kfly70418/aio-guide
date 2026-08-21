import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testArticleTranslation() {
  const slug = 'api-key-leaked-emergency-response'

  console.log('🔍 测试文章翻译获取\n')
  console.log(`Slug: ${slug}\n`)

  // 获取文章基础数据
  const { data: article } = await supabase
    .from('articles')
    .select('id, title')
    .eq('slug', slug)
    .single()

  if (!article) {
    console.log('❌ 文章不存在')
    return
  }

  console.log(`✅ 找到文章: ${article.title}`)
  console.log(`   ID: ${article.id}\n`)

  // 获取俄语翻译
  const { data: translations } = await supabase
    .from('translations')
    .select('*')
    .eq('resource_type', 'article')
    .eq('resource_id', article.id)
    .eq('locale', 'ru')

  if (!translations || translations.length === 0) {
    console.log('❌ 没有俄语翻译')
    return
  }

  console.log(`📊 俄语翻译数据:\n`)
  translations.forEach(t => {
    const preview = t.value.length > 100 ? t.value.substring(0, 100) + '...' : t.value
    console.log(`   ${t.field}:`)
    console.log(`   ${preview}\n`)
  })
}

testArticleTranslation()
