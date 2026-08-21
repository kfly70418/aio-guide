/**
 * 查看数据库中现有的模型
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkModels() {
  const { data, error } = await supabase
    .from('models')
    .select('slug, name, family')
    .order('family', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('❌ 查询失败:', error)
    return
  }

  console.log(`📊 数据库中现有 ${data.length} 个模型\n`)

  const byFamily = data.reduce((acc: any, model) => {
    if (!acc[model.family]) acc[model.family] = []
    acc[model.family].push(model)
    return acc
  }, {})

  Object.keys(byFamily).sort().forEach(family => {
    console.log(`\n${family}:`)
    byFamily[family].forEach((m: any) => {
      console.log(`  - ${m.name} (${m.slug})`)
    })
  })
}

checkModels()
