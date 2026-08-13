import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAction } from '@/lib/auditLog'
import { toCSV, withBom } from '@/lib/csv'

const COLUMNS = [
  'provider_slug',
  'channel_name',
  'model_slug',
  'price_input',
  'price_output',
  'rate',
  'currency',
  'effective_date',
  'status',
  'notes',
  'verified_at',
]

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('prices')
    .select(`
      price_input,
      price_output,
      rate,
      currency,
      effective_date,
      status,
      notes,
      verified_at,
      channel:channels(name, provider:providers(slug)),
      model:models(slug)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const rows = (data ?? []).map((p) => ({
    provider_slug: p.channel?.provider?.slug ?? '',
    channel_name: p.channel?.name ?? '',
    model_slug: p.model?.slug ?? '',
    price_input: p.price_input,
    price_output: p.price_output,
    rate: p.rate ?? '',
    currency: p.currency,
    effective_date: p.effective_date,
    status: p.status,
    notes: p.notes ?? '',
    verified_at: p.verified_at ?? '',
  }))

  await logAction({
    action: 'export_prices_csv',
    resourceType: 'price',
    details: { count: rows.length },
  })

  const csv = withBom(toCSV(rows, COLUMNS))
  const filename = `prices-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
