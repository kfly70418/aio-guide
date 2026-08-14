/**
 * Import providers from API Ranking scraped data - Version 2
 * Simplified to match existing schema + manual migration
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

interface ScrapedProvider {
  name: string
  domain: string
  summary: string
  coupon_code?: string
  coupon_note?: string
  metrics: Record<string, string>
  model_prices: Array<{
    model: string
    channels: Array<{
      '渠道/分组': string
      '官方价倍率': string
      '输入价': string
      '输出价': string
      '渠道说明'?: string
    }>
  }>
}

async function importProviders(jsonDir: string) {
  const files = readdirSync(jsonDir).filter(f => f.endsWith('.json')).sort()

  console.log(`Found ${files.length} provider JSON files\n`)

  let successCount = 0

  for (const file of files) {
    const filePath = join(jsonDir, file)
    const content = readFileSync(filePath, 'utf-8')
    const data: ScrapedProvider = JSON.parse(content)

    console.log(`Processing: ${data.name}`)

    const slug = data.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[·•]/g, '-')
      .replace(/[^\w\-]/g, '')

    // Parse metrics
    const stabilityScore = parseStability(data.metrics['稳定性'])
    const verificationStatus = parseVerification(data.metrics['真假检测'])
    const minRecharge = parseRecharge(data.metrics['最低起充'])
    const freeCredits = parseCredits(data.metrics['赠送额度'])

    // Insert provider
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .insert({
        name: data.name,
        name_en: data.name,
        slug: slug,
        website_url: `https://${data.domain}`,
        description: data.summary,
        logo_url: null,
        status: 'active',
        is_featured: false,
        sort_order: successCount,
        coupon_code: data.coupon_code || null,
        coupon_note: data.coupon_note || null,
        min_recharge: minRecharge,
        free_credits: freeCredits,
        refund_policy: data.metrics['退款政策'] || null,
        invoice_policy: data.metrics['开票'] || null,
        payment_methods: data.metrics['支付方式'] || null,
        stability_score: stabilityScore,
        verification_status: verificationStatus,
        price_level: data.metrics['价格水平'] || null,
      })
      .select()
      .single()

    if (providerError) {
      console.error(`  ❌ Failed: ${providerError.message}`)
      console.error(`     Details: ${JSON.stringify(providerError)}`)
      continue
    }

    console.log(`  ✓ Provider inserted: ${provider.id}`)
    successCount++

    // Insert models and prices
    let priceCount = 0

    for (const modelPrice of data.model_prices) {
      const modelName = modelPrice.model

      // Get or create model
      let { data: model } = await supabase
        .from('models')
        .select('id')
        .eq('name', modelName)
        .single()

      if (!model) {
        const slug = modelName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')

        const { data: newModel, error: modelError } = await supabase
          .from('models')
          .insert({
            slug: slug,
            name: modelName,
            family: inferProvider(modelName),
            provider_official: inferProvider(modelName),
            status: 'published',
          })
          .select()
          .single()

        if (modelError) {
          console.error(`    ⚠ Failed to insert model ${modelName}: ${modelError.message}`)
          continue
        }
        model = newModel
      }

      // Insert channels and prices
      for (const channel of modelPrice.channels) {
        const channelName = channel['渠道/分组']

        // Get or create channel
        let { data: channelRecord } = await supabase
          .from('channels')
          .select('id')
          .eq('name', channelName)
          .single()

        if (!channelRecord) {
          const channelSlug = channelName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')

          const { data: newChannel } = await supabase
            .from('channels')
            .insert({
              slug: channelSlug,
              name: channelName,
              description: channel['渠道说明'] || null,
              status: 'published',
            })
            .select()
            .single()

          channelRecord = newChannel
        }

        if (!channelRecord) continue

        // Insert price
        const inputPrice = parsePrice(channel['输入价'])
        const outputPrice = parsePrice(channel['输出价'])
        const rate = parseRate(channel['官方价倍率'])

        const { error: priceError } = await supabase.from('prices').insert({
          provider_id: provider.id,
          model_id: model.id,
          channel_id: channelRecord.id,
          input_price: inputPrice,
          output_price: outputPrice,
          currency: 'CNY',
          rate: rate,
          effective_date: new Date().toISOString().split('T')[0],
        })

        if (!priceError) {
          priceCount++
        }
      }
    }

    console.log(`  ✓ Imported ${priceCount} prices\n`)
  }

  console.log(`\n✅ Import complete: ${successCount}/${files.length} providers`)
}

// Helper parsers
function parseRecharge(value: string): number | null {
  if (!value) return null
  const match = value.match(/¥?(\d+)/)
  return match ? parseInt(match[1]) : null
}

function parseCredits(value: string): number | null {
  if (!value || value.includes('无')) return null
  const match = value.match(/\$?([\d.]+)/)
  return match ? parseFloat(match[1]) : null
}

function parseStability(value: string): number {
  if (!value) return 3
  if (value.includes('优秀')) return 5
  if (value.includes('良好')) return 4
  if (value.includes('一般')) return 3
  return 3
}

function parseVerification(value: string): 'verified' | 'unverified' | 'flagged' {
  if (!value) return 'unverified'
  if (value.includes('通过')) return 'verified'
  if (value.includes('未通过')) return 'flagged'
  return 'unverified'
}

function parsePrice(value: string): number {
  const match = value.match(/([\d.]+)/)
  return match ? parseFloat(match[1]) : 0
}

function parseRate(value: string): number | null {
  const match = value.match(/([\d.]+)x/)
  return match ? parseFloat(match[1]) : null
}

function inferProvider(modelName: string): string {
  if (modelName.includes('GPT')) return 'OpenAI'
  if (modelName.includes('Claude')) return 'Anthropic'
  if (modelName.includes('Gemini')) return 'Google'
  return 'Other'
}

function inferModelType(modelName: string): string {
  if (modelName.includes('Opus') || modelName.includes('5.6 Sol')) return 'flagship'
  if (modelName.includes('Sonnet') || modelName.includes('5.6 Terra') || modelName.includes('5.5')) return 'balanced'
  if (modelName.includes('Haiku') || modelName.includes('Luna')) return 'fast'
  if (modelName.includes('Fable')) return 'flagship'
  return 'balanced'
}

// Run
const jsonDir = process.argv[2]
if (!jsonDir) {
  console.error('Usage: tsx scripts/import-providers-v2.ts <json-directory-path>')
  process.exit(1)
}

importProviders(jsonDir).catch(console.error)
