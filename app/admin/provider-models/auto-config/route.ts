import { createClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const CONFIG: Record<string, 'full' | 'core' | 'common'> = {
  'DuiAPI': 'core',
  'wawapi.top': 'core',
  'api-top.com': 'core',
  'api.koozhan.com': 'core',
  'API2D': 'full',
  'OpenAI-HK': 'full',
  'APIHub': 'full',
  'LinkAI': 'full',
  'CUN.ai': 'common',
  'Modelflare': 'common',
  'AIchatOS': 'common',
  'AISKT': 'common',
  'AceDataCloud': 'common',
  'GPT-API': 'common',
}

interface Model {
  id: string
  name: string
  family: string
}

function selectModels(models: Model[], strategy: 'full' | 'core' | 'common'): Model[] {
  if (strategy === 'full') {
    return models
  }

  if (strategy === 'core') {
    return models.filter(m =>
      (m.family === 'Claude' && (m.name.includes('Sonnet') || m.name.includes('Opus'))) ||
      (m.family === 'GPT' && (m.name.includes('o1') || m.name.includes('o3') || m.name.includes('4o') || m.name.includes('4-turbo'))) ||
      (m.family === 'Gemini' && (m.name.includes('2.0') || m.name.includes('1.5 Pro')))
    )
  }

  // common
  return models.filter(m =>
    (m.family === 'Claude' && (m.name.includes('Sonnet') || m.name.includes('Haiku'))) ||
    (m.family === 'GPT' && (m.name.includes('4o') || m.name.includes('4-turbo') || m.name.includes('3.5'))) ||
    (m.family === 'Gemini' && m.name.includes('1.5'))
  )
}

export async function POST() {
  const supabase = createAdminClient()

  try {
    // 查询所有模型
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('id, name, family')
      .eq('status', 'published')

    if (modelsError) throw modelsError

    // 查询所有已核验服务商
    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('id, name, slug')
      .eq('verification_status', 'verified')

    if (providersError) throw providersError

    const results = []

    for (const provider of providers || []) {
      const strategy = CONFIG[provider.name]

      if (!strategy) {
        results.push({ provider: provider.name, status: 'skipped', reason: '未配置策略' })
        continue
      }

      // 选择模型
      const selectedModels = selectModels(models || [], strategy)

      if (selectedModels.length === 0) {
        results.push({ provider: provider.name, status: 'skipped', reason: '没有匹配的模型' })
        continue
      }

      // 查找或创建 channel
      let { data: channels } = await supabase
        .from('channels')
        .select('id')
        .eq('provider_id', provider.id)

      let channelId: string

      if (channels && channels.length > 0) {
        channelId = channels[0].id
      } else {
        const { data: newChannel, error: channelError } = await supabase
          .from('channels')
          .insert({
            provider_id: provider.id,
            name: '默认渠道',
            is_primary: true,
            priority: 0,
            status: 'active'
          })
          .select('id')
          .single()

        if (channelError) throw channelError
        channelId = newChannel.id
      }

      // 删除旧价格
      await supabase
        .from('prices')
        .delete()
        .eq('channel_id', channelId)

      // 插入新价格
      const prices = selectedModels.map(m => ({
        channel_id: channelId,
        model_id: m.id,
        status: 'active',
        input_price: 0,
        output_price: 0,
        currency: 'CNY'
      }))

      const { error: pricesError } = await supabase
        .from('prices')
        .insert(prices)

      if (pricesError) throw pricesError

      results.push({
        provider: provider.name,
        status: 'success',
        modelCount: selectedModels.length,
        strategy
      })
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
