/**
 * 翻译服务商的财务字段（充值、手续费等）
 * 将中文金额和手续费翻译为俄语
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Provider {
  id: string
  name: string
  min_topup: string | null
  transaction_fee: string | null
  trial_credit: string | null
}

async function translateProviderFields(provider: Provider): Promise<{
  min_topup?: string
  transaction_fee?: string
  trial_credit?: string
}> {
  const fieldsToTranslate: string[] = []

  if (provider.min_topup) fieldsToTranslate.push(`最低充值: ${provider.min_topup}`)
  if (provider.transaction_fee) fieldsToTranslate.push(`交易费: ${provider.transaction_fee}`)
  if (provider.trial_credit) fieldsToTranslate.push(`试用额度: ${provider.trial_credit}`)

  if (fieldsToTranslate.length === 0) {
    return {}
  }

  const prompt = `你是专业的中文到俄语技术翻译专家，专门翻译 AI API 服务商的财务信息。

服务商：${provider.name}

请翻译以下字段到俄语：
${fieldsToTranslate.join('\n')}

**翻译要求：**
1. 货币符号：
   - ¥ (人民币) → ₽ (卢布)
   - $ (美元) 保持不变
   - 如果只是数字没有货币符号，根据上下文判断

2. 金额转换规则：
   - 如果是人民币(¥)，转换为等值卢布(₽)，汇率约 1:13
   - 例如：¥7 → ₽91, ¥10 → ₽130, ¥100 → ₽1300

3. 手续费：
   - 如果是百分比，保持数字，翻译文字部分
   - 例如："退款5%手续费" → "Комиссия 5% при возврате"
   - 例如："追款收1%" → "Комиссия 1% при взыскании"

4. 特殊词汇：
   - "手续费" → "комиссия"
   - "退款" → "возврат средств"
   - "充值" → "пополнение"
   - "试用" → "пробный период"

请以 JSON 格式返回，只包含需要翻译的字段：
{
  "min_topup": "翻译后的最低充值",
  "transaction_fee": "翻译后的交易费",
  "trial_credit": "翻译后的试用额度"
}

只返回 JSON，不要其他说明。`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

  // 提取 JSON
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error(`AI 未返回有效的 JSON: ${responseText}`)
  }

  return JSON.parse(jsonMatch[0])
}

async function main() {
  console.log('💰 开始翻译服务商财务字段到俄语\n')
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
  let failCount = 0
  let skipCount = 0

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i]

    // 检查是否有需要翻译的字段
    const hasFields = provider.min_topup || provider.transaction_fee || provider.trial_credit

    if (!hasFields) {
      console.log(`[${i + 1}/${providers.length}] ${provider.name} - 无财务字段，跳过\n`)
      skipCount++
      continue
    }

    console.log(`[${i + 1}/${providers.length}] 翻译: ${provider.name}`)
    console.log(`  原始数据:`)
    if (provider.min_topup) console.log(`    最低充值: ${provider.min_topup}`)
    if (provider.transaction_fee) console.log(`    交易费: ${provider.transaction_fee}`)
    if (provider.trial_credit) console.log(`    试用额度: ${provider.trial_credit}`)

    try {
      // AI 翻译
      const translated = await translateProviderFields(provider)

      // 保存到数据库
      const translations = []

      if (translated.min_topup) {
        translations.push({
          resource_type: 'provider',
          resource_id: provider.id,
          locale: 'ru',
          field: 'min_topup',
          value: translated.min_topup,
        })
      }

      if (translated.transaction_fee) {
        translations.push({
          resource_type: 'provider',
          resource_id: provider.id,
          locale: 'ru',
          field: 'transaction_fee',
          value: translated.transaction_fee,
        })
      }

      if (translated.trial_credit) {
        translations.push({
          resource_type: 'provider',
          resource_id: provider.id,
          locale: 'ru',
          field: 'trial_credit',
          value: translated.trial_credit,
        })
      }

      if (translations.length > 0) {
        const { error: insertError } = await supabase
          .from('translations')
          .upsert(translations, {
            onConflict: 'resource_type,resource_id,locale,field',
          })

        if (insertError) {
          console.error('  ❌ 保存失败:', insertError.message)
          failCount++
        } else {
          console.log('  ✅ 翻译完成:')
          if (translated.min_topup) console.log(`    最低充值: ${translated.min_topup}`)
          if (translated.transaction_fee) console.log(`    交易费: ${translated.transaction_fee}`)
          if (translated.trial_credit) console.log(`    试用额度: ${translated.trial_credit}`)
          successCount++
        }
      }
    } catch (error: any) {
      console.error('  ❌ 翻译失败:', error.message)
      failCount++
    }

    console.log('')

    // 避免 API 限流
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log('─'.repeat(60))
  console.log(`✅ 翻译完成`)
  console.log(`📊 成功: ${successCount}，跳过: ${skipCount}，失败: ${failCount}`)
}

if (require.main === module) {
  main().catch(console.error)
}
