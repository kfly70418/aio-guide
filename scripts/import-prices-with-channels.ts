import { createClient } from '@supabase/supabase-js'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface ProviderJSON {
  name: string
  model_prices: Array<{
    model: string
    channels: Array<{
      '渠道/分组': string
      '官方价倍率': string
      '输入价': string
      '输出价': string
      '缓存价格'?: string
    }>
  }>
}

// 解析价格字符串 "¥0.80" -> 0.80
function parsePrice(priceStr: string): number {
  const match = priceStr.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 0
}

// 解析倍率 "0.16x" -> 0.16
function parseRate(rateStr: string): number | null {
  const match = rateStr.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : null
}

async function main() {
  const dataDir = process.argv[2]
  if (!dataDir) {
    console.error('Usage: npx tsx import-prices-with-channels.ts <data-directory>')
    process.exit(1)
  }

  const files = await readdir(dataDir)
  const jsonFiles = files.filter(f => f.endsWith('.json'))
  console.log(`Found ${jsonFiles.length} provider JSON files\n`)

  for (const file of jsonFiles) {
    const data: ProviderJSON = JSON.parse(
      await readFile(join(dataDir, file), 'utf-8')
    )

    console.log(`Processing: ${data.name}`)

    // 1. 查找 provider（用 name 匹配）
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('name', data.name)
      .single()

    if (providerError || !provider) {
      console.log(`  ⚠ Provider not found: ${data.name}`)
      continue
    }

    // 2. 为该 provider 创建/获取默认 channel
    const { data: existingChannel } = await supabase
      .from('channels')
      .select('id')
      .eq('provider_id', provider.id)
      .eq('name', '官方渠道')
      .single()

    let channelId: string

    if (existingChannel) {
      channelId = existingChannel.id
      console.log(`  ✓ Using existing channel: ${channelId}`)
    } else {
      const { data: newChannel, error: channelError } = await supabase
        .from('channels')
        .insert({
          provider_id: provider.id,
          name: '官方渠道',
          description: `${data.name}官方渠道`,
          is_primary: true,
          priority: 1,
          status: 'active'
        })
        .select('id')
        .single()

      if (channelError || !newChannel) {
        console.log(`  ⚠ Failed to create channel: ${channelError?.message}`)
        continue
      }

      channelId = newChannel.id
      console.log(`  ✓ Created channel: ${channelId}`)
    }

    // 3. 导入价格
    let priceCount = 0

    for (const modelPrice of data.model_prices) {
      // 查找 model
      const { data: model } = await supabase
        .from('models')
        .select('id')
        .eq('name', modelPrice.model)
        .single()

      if (!model) {
        console.log(`    ⚠ Model not found: ${modelPrice.model}`)
        continue
      }

      for (const channelData of modelPrice.channels) {
        const inputPrice = parsePrice(channelData['输入价'])
        const outputPrice = parsePrice(channelData['输出价'])
        const rate = parseRate(channelData['官方价倍率'])

        if (inputPrice === 0 && outputPrice === 0) {
          continue // 跳过无效价格
        }

        const { error: priceError } = await supabase
          .from('prices')
          .upsert({
            channel_id: channelId,
            model_id: model.id,
            price_input: inputPrice,
            price_output: outputPrice,
            rate: rate,
            currency: 'CNY',
            effective_date: new Date().toISOString().split('T')[0],
            status: 'active'
          }, {
            onConflict: 'channel_id,model_id'
          })

        if (priceError) {
          console.log(`    ⚠ Failed to upsert price: ${priceError.message}`)
        } else {
          priceCount++
        }
      }
    }

    console.log(`  ✓ Imported ${priceCount} prices\n`)
  }

  console.log('Import completed!')
}

main().catch(console.error)
