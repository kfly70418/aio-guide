import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function main() {
  // 直接查询一条记录看所有字段
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error:', error)
  } else if (data && data[0]) {
    console.log('Available columns:')
    Object.keys(data[0]).sort().forEach(col => {
      console.log(`  - ${col}`)
    })
  } else {
    console.log('No data in providers table')
  }
}

main()
