/**
 * 检查数据库表结构，了解多语言支持情况
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkTableStructure() {
  console.log('📋 检查数据库表结构\n')

  // 检查 providers 表
  const { data: provider } = await supabase
    .from('providers')
    .select('*')
    .limit(1)
    .single()

  console.log('providers 表字段:')
  if (provider) {
    Object.keys(provider).forEach(key => {
      console.log(`  - ${key}`)
    })
  }

  // 检查 articles 表
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .limit(1)
    .maybeSingle()

  console.log('\narticles 表字段:')
  if (article) {
    Object.keys(article).forEach(key => {
      console.log(`  - ${key}`)
    })
  }
}

checkTableStructure()
