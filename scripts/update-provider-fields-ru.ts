/**
 * 手动更新服务商财务字段的俄语翻译
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 手动翻译映射表
const fieldTranslations: Record<string, Record<string, string>> = {
  // 最低充值
  min_topup: {
    '¥10': '₽130',
    '¥1': '₽13',
    '¥8': '₽104',
    '¥20': '₽260',
    '¥7': '₽91',
  },
  // 交易费
  transaction_fee: {
    '退款无手续费': 'Возврат без комиссии',
    '退款1.6%手续费': 'Комиссия 1.6% при возврате',
    '退款3%手续费': 'Комиссия 3% при возврате',
    '退款5%手续费': 'Комиссия 5% при возврате',
    '退款收 1% 手续费': 'Комиссия 1% при возврате',
  },
  // 试用额度
  trial_credit: {
    '$3': '$3',
    '$0.5': '$0.5',
    '$0.60': '$0.60',
    '免费体验额度': 'Бесплатный пробный баланс',
    '¥0.1': '₽1.3',
    '¥7': '₽91',
  },
}

async function updateProviderFields() {
  console.log('💰 开始更新服务商财务字段俄语翻译\n')
  console.log('─'.repeat(60))

  // 获取所有已发布的服务商
  const { data: providers, error } = await supabase
    .from('providers')
    .select('id, name, min_topup, transaction_fee, trial_credit')
    .eq('status', 'published')
    .order('sort_order', { ascending: false })

  if (error || !providers) {
    console.error('❌ 获取服务商失败:', error)
    return
  }

  console.log(`📊 共 ${providers.length} 个服务商需要检查\n`)

  let successCount = 0
  let skipCount = 0

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i]

    const translations = []

    // 翻译 min_topup
    if (provider.min_topup && fieldTranslations.min_topup[provider.min_topup]) {
      translations.push({
        resource_type: 'provider',
        resource_id: provider.id,
        locale: 'ru',
        field: 'min_topup',
        value: fieldTranslations.min_topup[provider.min_topup],
      })
    }

    // 翻译 transaction_fee
    if (provider.transaction_fee && fieldTranslations.transaction_fee[provider.transaction_fee]) {
      translations.push({
        resource_type: 'provider',
        resource_id: provider.id,
        locale: 'ru',
        field: 'transaction_fee',
        value: fieldTranslations.transaction_fee[provider.transaction_fee],
      })
    }

    // 翻译 trial_credit
    if (provider.trial_credit && fieldTranslations.trial_credit[provider.trial_credit]) {
      translations.push({
        resource_type: 'provider',
        resource_id: provider.id,
        locale: 'ru',
        field: 'trial_credit',
        value: fieldTranslations.trial_credit[provider.trial_credit],
      })
    }

    if (translations.length === 0) {
      console.log(`[${i + 1}/${providers.length}] ${provider.name} - 无需翻译，跳过`)
      skipCount++
      continue
    }

    console.log(`[${i + 1}/${providers.length}] 更新: ${provider.name}`)

    try {
      const { error: insertError } = await supabase
        .from('translations')
        .upsert(translations, {
          onConflict: 'resource_type,resource_id,locale,field',
        })

      if (insertError) {
        console.error('  ❌ 保存失败:', insertError.message)
      } else {
        translations.forEach(t => {
          console.log(`  ✅ ${t.field}: ${t.value}`)
        })
        successCount++
      }
    } catch (error: any) {
      console.error('  ❌ 更新失败:', error.message)
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`✅ 更新完成`)
  console.log(`📊 成功: ${successCount}，跳过: ${skipCount}`)
}

if (require.main === module) {
  updateProviderFields().catch(console.error)
}
