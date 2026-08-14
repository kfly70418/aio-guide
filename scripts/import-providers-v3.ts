import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface ProviderJSON {
  name: string
  domain: string
  official_redirect_url: string
  summary: string
  coupon_code?: string
  coupon_note?: string
  metrics: {
    稳定性?: string
    真假检测?: string
    价格水平?: string
    支付方式?: string
    最低起充?: string
    赠送额度?: string
    开票?: string
    退款政策?: string
  }
  model_prices: Array<{
    model: string
    price_levels: string[]
    channels: Array<{
      '渠道/分组': string
      官方价倍率?: string
      输入价?: string
      输出价?: string
      渠道说明?: string
    }>
  }>
}

function parseStability(value?: string): number | null {
  if (!value) return null
  const map: Record<string, number> = {
    '优秀': 5,
    '良好': 4,
    '一般': 3,
    '较差': 2,
    '极差': 1,
  }
  return map[value] || null
}

function parseVerification(value?: string): string {
  if (!value) return 'pending'
  if (value.includes('通过')) return 'verified'
  if (value.includes('失败') || value.includes('假')) return 'failed'
  if (value.includes('疑似')) return 'suspect'
  return 'pending'
}

function parseFreeCredits(value?: string): number | null {
  if (!value) return null
  const match = value.match(/\$([0-9.]+)/)
  return match ? parseFloat(match[1]) : null
}

function parseMinRecharge(value?: string): number | null {
  if (!value) return null
  const match = value.match(/¥([0-9]+)/)
  return match ? parseInt(match[1]) : null
}

function inferFamily(modelName: string): string {
  if (modelName.toLowerCase().includes('gpt')) return 'GPT'
  if (modelName.toLowerCase().includes('claude')) return 'Claude'
  if (modelName.toLowerCase().includes('gemini')) return 'Gemini'
  if (modelName.toLowerCase().includes('grok')) return 'Grok'
  return 'Other'
}

function parsePrice(priceStr?: string): number | null {
  if (!priceStr) return null
  const match = priceStr.match(/¥([0-9.]+)/)
  return match ? parseFloat(match[1]) : null
}

async function main() {
  const jsonDir = process.argv[2]
  if (!jsonDir) {
    console.error('Usage: npx tsx import-providers-v3.ts <json-directory>')
    process.exit(1)
  }

  const files = fs.readdirSync(jsonDir).filter(f => f.endsWith('.json'))
  console.log(`Found ${files.length} provider JSON files\n`)

  let successCount = 0

  for (const file of files) {
    const filePath = path.join(jsonDir, file)
    const json: ProviderJSON = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    console.log(`Processing: ${json.name}`)

    // 1. 插入或更新 provider
    const slug = json.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')

    const { data: existingProvider } = await supabase
      .from('providers')
      .select('id')
      .eq('slug', slug)
      .single()

    let providerId: string

    if (existingProvider) {
      const { error } = await supabase
        .from('providers')
        .update({
          name: json.name,
          domain: json.domain,
          website_url: json.official_redirect_url,
          description: json.summary,
          stability_score: parseStability(json.metrics['稳定性']),
          verification_status: parseVerification(json.metrics['真假检测']),
          price_level: json.metrics['价格水平'] || null,
          payment_methods: json.metrics['支付方式'] || null,
          refund_policy: json.metrics['退款政策'] || null,
          invoice_policy: json.metrics['开票'] || null,
          free_credits: parseFreeCredits(json.metrics['赠送额度']),
          min_recharge: parseMinRecharge(json.metrics['最低起充']),
          coupon_code: json.coupon_code || null,
          coupon_note: json.coupon_note || null,
          status: 'published',
        })
        .eq('id', existingProvider.id)

      if (error) {
        console.error(`  ✗ Failed to update provider: ${error.message}`)
        continue
      }
      providerId = existingProvider.id
      console.log(`  ✓ Provider updated: ${providerId}`)
    } else {
      const { data: newProvider, error } = await supabase
        .from('providers')
        .insert({
          slug,
          name: json.name,
          domain: json.domain,
          website_url: json.official_redirect_url,
          description: json.summary,
          stability_score: parseStability(json.metrics['稳定性']),
          verification_status: parseVerification(json.metrics['真假检测']),
          price_level: json.metrics['价格水平'] || null,
          payment_methods: json.metrics['支付方式'] || null,
          refund_policy: json.metrics['退款政策'] || null,
          invoice_policy: json.metrics['开票'] || null,
          free_credits: parseFreeCredits(json.metrics['赠送额度']),
          min_recharge: parseMinRecharge(json.metrics['最低起充']),
          coupon_code: json.coupon_code || null,
          coupon_note: json.coupon_note || null,
          status: 'published',
        })
        .select()
        .single()

      if (error || !newProvider) {
        console.error(`  ✗ Failed to insert provider: ${error?.message}`)
        continue
      }
      providerId = newProvider.id
      console.log(`  ✓ Provider inserted: ${providerId}`)
    }

    // 2. 处理模型与价格
    let modelCount = 0
    let priceCount = 0

    for (const modelPrice of json.model_prices) {
      const modelName = modelPrice.model

      // 2.1 确保模型存在
      const modelSlug = modelName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')

      let { data: model } = await supabase
        .from('models')
        .select('id')
        .eq('slug', modelSlug)
        .single()

      if (!model) {
        const { data: newModel, error: modelError } = await supabase
          .from('models')
          .insert({
            slug: modelSlug,
            name: modelName,
            family: inferFamily(modelName),
            provider_official: inferFamily(modelName),
            status: 'published',
          })
          .select()
          .single()

        if (modelError) {
          console.error(`    ⚠ Failed to insert model ${modelName}: ${modelError.message}`)
          continue
        }
        model = newModel
        modelCount++
      }

      // 2.2 处理该模型下的所有渠道
      for (const channelData of modelPrice.channels) {
        const channelName = channelData['渠道/分组']

        // 2.2.1 确保渠道存在（属于这个 provider）
        let { data: channel } = await supabase
          .from('channels')
          .select('id')
          .eq('provider_id', providerId)
          .eq('name', channelName)
          .single()

        if (!channel) {
          const { data: newChannel, error: channelError } = await supabase
            .from('channels')
            .insert({
              provider_id: providerId,
              name: channelName,
              description: channelData['渠道说明'] || null,
              status: 'active',
            })
            .select()
            .single()

          if (channelError) {
            console.error(`    ⚠ Failed to insert channel ${channelName}: ${channelError.message}`)
            continue
          }
          channel = newChannel
        }

        // 2.2.2 插入价格记录
        const inputPrice = parsePrice(channelData['输入价'])
        const outputPrice = parsePrice(channelData['输出价'])

        if (inputPrice !== null || outputPrice !== null) {
          const { error: priceError } = await supabase
            .from('prices')
            .upsert({
              provider_id: providerId,
              model_id: model.id,
              channel_id: channel.id,
              price_input: inputPrice,
              price_output: outputPrice,
              status: 'active',
            }, {
              onConflict: 'provider_id,model_id,channel_id',
            })

          if (priceError) {
            console.error(`    ⚠ Failed to upsert price: ${priceError.message}`)
          } else {
            priceCount++
          }
        }
      }
    }

    console.log(`  ✓ Imported ${modelCount} new models, ${priceCount} prices\n`)
    successCount++
  }

  console.log(`\n✅ Import complete: ${successCount}/${files.length} providers`)
}

main().catch(console.error)
