import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function listArticles() {
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, title')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (!articles || articles.length === 0) {
    console.log('没有找到文章')
    return
  }

  console.log('📋 文章列表:\n')
  articles.forEach((a, i) => {
    console.log(`${i + 1}. ${a.slug}`)
    console.log(`   ${a.title}\n`)
  })
}

listArticles()
