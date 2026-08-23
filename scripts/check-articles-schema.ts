/**
 * 检查 articles 表结构
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkArticlesSchema() {
  console.log('🔍 检查 articles 表结构\n')

  // 尝试获取一篇文章看看有哪些字段
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    console.error('❌ 查询失败:', error)
    return
  }

  console.log('📊 articles 表字段:')
  console.log(Object.keys(data || {}))
}

if (require.main === module) {
  checkArticlesSchema().catch(console.error)
}
