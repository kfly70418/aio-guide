import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function updateArticle() {
  const { data, error } = await supabase
    .from('articles')
    .update({
      images_completed: true,
      updated_at: new Date().toISOString()
    })
    .eq('slug', 'what-if-api-service-shuts-down')
    .select()

  if (error) {
    console.error('更新失败:', error.message)
    return
  }

  console.log('✅ 文章配图状态已更新')
  console.log('文章标题:', data[0].title)
  console.log('配图完成:', data[0].images_completed)
}

updateArticle()
