import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data, error } = await supabase
    .from('providers')
    .select('name, api_base_url')
    .order('sort_order', { ascending: true })
    .limit(10)

  if (error) {
    console.error('❌ 错误:', error)
    process.exit(1)
  }

  console.log('📋 数据库中的中转站:\n')
  data?.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`)
    console.log(`   ${p.api_base_url}\n`)
  })
}

main()
