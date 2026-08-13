import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChannelManager from '@/components/admin/ChannelManager'

export default async function ProviderChannelsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: provider } = await supabase
    .from('providers')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!provider) {
    notFound()
  }

  const { data: channels } = await supabase
    .from('channels')
    .select('id, name, description, is_primary, priority, status')
    .eq('provider_id', id)
    .order('priority', { ascending: false })
    .order('name', { ascending: true })

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/providers" className="text-sm text-blue-600 hover:underline">
          ← 返回服务商列表
        </Link>
        <h1 className="text-2xl font-bold mt-2">{provider.name} · 渠道管理</h1>
      </div>

      <ChannelManager providerId={provider.id} channels={channels ?? []} />
    </div>
  )
}
