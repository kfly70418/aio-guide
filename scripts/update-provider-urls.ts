/**
 * 更新服务商网址
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const updates = [
  { name: 'AIMZ', website_url: 'https://mzlone.top/' },
  { name: 'CCTQ', website_url: 'https://www.cctq.ai/' },
  { name: 'Ls.API', website_url: 'https://lsapi.cn/' },
  { name: 'Micu', website_url: 'https://www.micuapi.ai/' },
  { name: 'SSSAiCode', website_url: 'https://sssaicode.com/' },
]

async function updateProviderUrls() {
  console.log('🔄 开始更新服务商网址')
  console.log('─'.repeat(60))

  for (const update of updates) {
    console.log(`\n更新: ${update.name}`)

    const { data, error } = await supabase
      .from('providers')
      .update({
        website_url: update.website_url,
        updated_at: new Date().toISOString()
      })
      .eq('name', update.name)
      .select()

    if (error) {
      console.error(`  ❌ 更新失败:`, error)
    } else if (data && data.length > 0) {
      console.log(`  ✅ 已更新网址: ${update.website_url}`)
    } else {
      console.log(`  ⚠️  未找到服务商`)
    }

    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n' + '─'.repeat(60))
  console.log('✅ 更新完成')

  // 统计有网址的服务商数量
  const { count } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true })
    .not('website_url', 'is', null)

  console.log(`📊 现有网址的服务商: ${count} / 24`)
}

async function main() {
  try {
    await updateProviderUrls()
  } catch (error) {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { updateProviderUrls }
