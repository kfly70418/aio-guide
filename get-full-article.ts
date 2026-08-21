import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getArticle() {
  const { data, error } = await supabase
    .from('articles')
    .select('content')
    .eq('slug', 'what-if-api-service-shuts-down')
    .single()

  if (error || !data) {
    console.error('查询失败:', error?.message)
    return
  }

  fs.writeFileSync('article-backup-plan.md', data.content, 'utf8')
  console.log('文章已保存到 article-backup-plan.md')
}

getArticle()
