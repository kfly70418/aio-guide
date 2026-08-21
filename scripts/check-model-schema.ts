/**
 * 查看 models 表结构
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkModelSchema() {
  const { data, error } = await supabase
    .from('models')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    console.error('❌ 查询失败:', error)
    return
  }

  console.log('📋 models 表字段结构:\n')
  console.log(JSON.stringify(data, null, 2))
  console.log('\n字段列表:')
  Object.keys(data).forEach(key => {
    console.log(`  - ${key}: ${typeof data[key]}`)
  })
}

checkModelSchema()
