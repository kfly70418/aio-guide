import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function parsePrice(priceStr: string): number {
  const match = priceStr.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 0
}

async function main() {
  const jsonPath = 'C:/Users/Administrator/Pictures/新建文件夹/API_Ranking_前10服务商_2026-08-11_170548/详情页JSON/08_LMU AI · 灵眸.json'
  const providerData = JSON.parse(readFileSync(jsonPath, 'utf-8'))

  console.log(`Processing: ${providerData.name}`)

  // Get provider
  const { data: provider } = await supabase
    .from('providers')
    .select('id, name')
    .eq('name', providerData.name)
    .single()

  if (!provider) {
    console.error('  ❌ Provider not found')
    return
  }

  console.log(`  ✓ Found provider: ${provider.id}`)

  // Get or create default channel
  let channel = await supabase
    .from('channels')
    .select('id')
    .eq('provider_id', provider.id)
    .eq('name', '官方渠道')
    .maybeSingle()
    .then(r => r.data)

  if (!channel) {
    const { data: newChannel, error: channelError } = await supabase
      .from('channels')
      .insert({
        provider_id: provider.id,
        name: '官方渠道',
        description: '服务商官方渠道',
        status: 'active' as const,
      })
      .select()
      .single()

    if (channelError || !newChannel) {
      console.error(`  ❌ Failed to create channel: ${channelError?.message}`)
      return
    }
    channel = newChannel
  }

  console.log(`  ✓ Created/updated channel: ${channel.id}`)

  // Import prices
  let priceCount = 0

  for (const modelPrice of providerData.model_prices) {
    const modelName = modelPrice.model

    // Get or create model
    const { data: model } = await supabase
      .from('models')
      .select('id')
      .eq('name', modelName)
      .maybeSingle()

    let modelId: string

    if (model) {
      modelId = model.id
    } else {
      const { data: newModel, error: modelError } = await supabase
        .from('models')
        .insert({
          name: modelName,
          name_display: modelName,
          provider_type: 'openai',
          model_type: 'text',
          status: 'active' as const,
        })
        .select('id')
        .single()

      if (modelError || !newModel) {
        console.error(`    ❌ Failed to create model ${modelName}`)
        continue
      }
      modelId = newModel.id
    }

    // Parse first price level
    const firstPrice = modelPrice.price_levels[0]
    if (!firstPrice) continue

    const inputPrice = parsePrice(firstPrice)
    const outputPrice = parsePrice(firstPrice)

    const { error: priceError } = await supabase
      .from('prices')
      .upsert(
        {
          channel_id: channel.id,
          model_id: modelId,
          price_input: inputPrice,
          price_output: outputPrice,
          currency: 'CNY',
          effective_date: new Date().toISOString().split('T')[0],
        },
        { onConflict: 'channel_id,model_id' }
      )

    if (priceError) {
      console.error(`    ❌ Failed to insert price for ${modelName}: ${priceError.message}`)
    } else {
      priceCount++
    }
  }

  console.log(`  ✓ Imported ${priceCount} prices`)
}

main()
