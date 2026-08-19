import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少环境变量')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateVerifiedDates() {
  const today = new Date().toISOString()

  console.log('🔄 开始更新服务商核验时间...')

  // 更新所有已核验服务商的核验时间为今天
  const { data, error } = await supabase
    .from('providers')
    .update({ verified_at: today })
    .not('verified_at', 'is', null)

  if (error) {
    console.error('❌ 更新失败:', error)
    process.exit(1)
  }

  // 查询更新后的数据
  const { data: providers, error: queryError } = await supabase
    .from('providers')
    .select('id, name, verified_at')
    .not('verified_at', 'is', null)
    .order('name')

  if (queryError) {
    console.error('❌ 查询失败:', queryError)
    process.exit(1)
  }

  console.log(`\n✅ 已更新 ${providers?.length || 0} 个服务商的核验时间为今天 (${today.split('T')[0]})`)
  console.log('\n已核验服务商列表:')
  providers?.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name} - ${p.verified_at.split('T')[0]}`)
  })
}

updateVerifiedDates()
