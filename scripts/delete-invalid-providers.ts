/**
 * 删除无效服务商脚本
 *
 * 删除以下服务商及其相关数据：
 * - Packy Code (超时)
 * - AceDataCloud (访问错误)
 * - AIchatOS (访问错误)
 * - AISKT (访问错误)
 * - APIHub (访问错误)
 * - GPT-API (访问错误)
 * - Modelflare (访问错误)
 * - 聚星AI (访问错误)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const providersToDelete = [
  'Packy Code',
  'AceDataCloud',
  'AIchatOS',
  'AISKT',
  'APIHub',
  'GPT-API',
  'Modelflare',
  '聚星AI'
]

async function deleteProviders() {
  console.log('🗑️  开始删除无效服务商')
  console.log('─'.repeat(60))

  for (const providerName of providersToDelete) {
    console.log(`\n处理: ${providerName}`)

    // 1. 查找服务商
    const { data: provider, error: findError } = await supabase
      .from('providers')
      .select('id, name, slug')
      .eq('name', providerName)
      .maybeSingle()

    if (findError) {
      console.error(`  ❌ 查询失败:`, findError)
      continue
    }

    if (!provider) {
      console.log(`  ⚠️  未找到服务商`)
      continue
    }

    console.log(`  找到服务商: ${provider.name} (${provider.slug})`)

    // 2. 查找该服务商的渠道
    const { data: channels } = await supabase
      .from('channels')
      .select('id')
      .eq('provider_id', provider.id)

    const channelIds = channels?.map(c => c.id) || []
    console.log(`  找到 ${channelIds.length} 个渠道`)

    // 3. 删除价格数据
    if (channelIds.length > 0) {
      const { error: pricesError } = await supabase
        .from('prices')
        .delete()
        .in('channel_id', channelIds)

      if (pricesError) {
        console.error(`  ❌ 删除价格失败:`, pricesError)
      } else {
        console.log(`  ✅ 已删除相关价格数据`)
      }
    }

    // 4. 删除渠道
    if (channelIds.length > 0) {
      const { error: channelsError } = await supabase
        .from('channels')
        .delete()
        .eq('provider_id', provider.id)

      if (channelsError) {
        console.error(`  ❌ 删除渠道失败:`, channelsError)
      } else {
        console.log(`  ✅ 已删除渠道`)
      }
    }

    // 5. 删除服务商
    const { error: providerError } = await supabase
      .from('providers')
      .delete()
      .eq('id', provider.id)

    if (providerError) {
      console.error(`  ❌ 删除服务商失败:`, providerError)
    } else {
      console.log(`  ✅ 已删除服务商`)
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log('✅ 删除操作完成')
  console.log('\n剩余服务商统计:')

  const { count } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 当前服务商总数: ${count}`)
}

async function main() {
  try {
    await deleteProviders()
  } catch (error) {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { deleteProviders }
