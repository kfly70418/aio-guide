import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { providerId, modelIds } = await request.json()

    if (!providerId || !Array.isArray(modelIds)) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. 查询或创建 channel
    let { data: channels } = await supabase
      .from('channels')
      .select('id')
      .eq('provider_id', providerId)
      .eq('is_primary', true)
      .limit(1)

    let channelId: string

    if (!channels || channels.length === 0) {
      const { data: provider } = await supabase
        .from('providers')
        .select('name')
        .eq('id', providerId)
        .single()

      if (!provider) {
        return NextResponse.json({ error: '服务商不存在' }, { status: 404 })
      }

      const { data: newChannel, error: channelError } = await supabase
        .from('channels')
        .insert({
          provider_id: providerId,
          name: `${provider.name} 官方渠道`,
          is_primary: true,
          status: 'active',
        })
        .select('id')
        .single()

      if (channelError) throw channelError
      channelId = newChannel.id
    } else {
      channelId = channels[0].id
    }

    // 2. 删除旧 prices
    await supabase.from('prices').delete().eq('channel_id', channelId)

    // 3. 插入新 prices
    if (modelIds.length > 0) {
      const pricesData = modelIds.map((modelId: string) => ({
        channel_id: channelId,
        model_id: modelId,
        price_input: 0,
        price_output: 0,
        status: 'active' as const,
        effective_date: new Date().toISOString().split('T')[0],
      }))

      const { error: pricesError } = await supabase
        .from('prices')
        .insert(pricesData)

      if (pricesError) throw pricesError
    }

    return NextResponse.json({ success: true, count: modelIds.length })
  } catch (error: any) {
    console.error('保存模型配置失败:', error)
    return NextResponse.json({ error: error.message || '保存失败' }, { status: 500 })
  }
}
