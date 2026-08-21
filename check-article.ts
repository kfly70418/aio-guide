import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkArticle() {
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug, content')
    .eq('slug', 'what-if-api-service-shuts-down')
    .single()

  if (error) {
    console.error('查询失败:', error.message)
    return
  }

  if (!data) {
    console.log('未找到文章')
    return
  }

  console.log('标题:', data.title)
  console.log('Slug:', data.slug)
  console.log('字数:', data.content.length)
  console.log('\n内容预览（前 500 字）:')
  console.log(data.content.substring(0, 500))
  console.log('\n需要配图的位置数量:', (data.content.match(/需要配图|!\[.*?\]\(.*?\)/g) || []).length)
}

checkArticle()
