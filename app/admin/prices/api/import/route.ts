import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAction } from '@/lib/auditLog'
import { parseCSV } from '@/lib/csv'
import type { ActiveStatus, Currency } from '@/lib/supabase/database.types'

interface ParsedRow {
  line: number
  provider_slug: string
  channel_name: string
  model_slug: string
  price_input: number
  price_output: number
  rate: number | null
  currency: Currency
  effective_date: string
  status: ActiveStatus
  notes: string | null
  channel_id: string
  model_id: string
  existing: boolean
}

interface RowError {
  line: number
  message: string
  raw: Record<string, string>
}

const REQUIRED_HEADERS = [
  'provider_slug',
  'channel_name',
  'model_slug',
  'price_input',
  'price_output',
]

async function analyze(csvText: string) {
  const supabase = await createClient()
  const records = parseCSV(csvText)

  if (records.length === 0) {
    return { valid: [], errors: [{ line: 1, message: 'CSV 没有数据行', raw: {} }] }
  }

  const headers = Object.keys(records[0])
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h))
  if (missing.length > 0) {
    return {
      valid: [],
      errors: [
        {
          line: 1,
          message: `缺少必需列：${missing.join(', ')}`,
          raw: {},
        },
      ],
    }
  }

  const [{ data: channels }, { data: models }, { data: existingPrices }] =
    await Promise.all([
      supabase.from('channels').select('id, name, provider:providers(slug)'),
      supabase.from('models').select('id, slug'),
      supabase.from('prices').select('id, channel_id, model_id'),
    ])

  const channelKey = new Map<string, string>()
  for (const c of channels ?? []) {
    const slug = c.provider?.slug
    if (slug) {
      channelKey.set(`${slug}::${c.name}`, c.id)
    }
  }

  const modelKey = new Map<string, string>()
  for (const m of models ?? []) {
    modelKey.set(m.slug, m.id)
  }

  const existingKey = new Set<string>()
  for (const p of existingPrices ?? []) {
    existingKey.add(`${p.channel_id}::${p.model_id}`)
  }

  const valid: ParsedRow[] = []
  const errors: RowError[] = []

  records.forEach((raw, idx) => {
    const line = idx + 2 // 表头占第 1 行

    const providerSlug = raw.provider_slug
    const channelName = raw.channel_name
    const modelSlug = raw.model_slug

    if (!providerSlug || !channelName || !modelSlug) {
      errors.push({ line, message: '服务商 slug、渠道名或模型 slug 为空', raw })
      return
    }

    const channelId = channelKey.get(`${providerSlug}::${channelName}`)
    if (!channelId) {
      errors.push({
        line,
        message: `找不到渠道：服务商 "${providerSlug}" 下没有名为 "${channelName}" 的渠道`,
        raw,
      })
      return
    }

    const modelId = modelKey.get(modelSlug)
    if (!modelId) {
      errors.push({ line, message: `找不到模型 slug："${modelSlug}"`, raw })
      return
    }

    const priceInput = Number(raw.price_input)
    const priceOutput = Number(raw.price_output)

    if (!Number.isFinite(priceInput) || priceInput < 0) {
      errors.push({ line, message: `输入价不是合法数字："${raw.price_input}"`, raw })
      return
    }
    if (!Number.isFinite(priceOutput) || priceOutput < 0) {
      errors.push({ line, message: `输出价不是合法数字："${raw.price_output}"`, raw })
      return
    }

    let rate: number | null = null
    if (raw.rate) {
      const parsed = Number(raw.rate)
      if (!Number.isFinite(parsed) || parsed < 0) {
        errors.push({ line, message: `倍率不是合法数字："${raw.rate}"`, raw })
        return
      }
      rate = parsed
    }

    const currencyRaw = raw.currency || 'CNY'
    if (currencyRaw !== 'CNY' && currencyRaw !== 'USD') {
      errors.push({ line, message: `币种只能是 CNY 或 USD，收到 "${currencyRaw}"`, raw })
      return
    }
    const currency: Currency = currencyRaw

    const statusRaw = raw.status || 'active'
    if (statusRaw !== 'active' && statusRaw !== 'inactive') {
      errors.push({
        line,
        message: `状态只能是 active 或 inactive，收到 "${statusRaw}"`,
        raw,
      })
      return
    }
    const status: ActiveStatus = statusRaw

    const effectiveDate = raw.effective_date || new Date().toISOString().slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
      errors.push({ line, message: `生效日期格式应为 YYYY-MM-DD，收到 "${effectiveDate}"`, raw })
      return
    }

    valid.push({
      line,
      provider_slug: providerSlug,
      channel_name: channelName,
      model_slug: modelSlug,
      price_input: priceInput,
      price_output: priceOutput,
      rate,
      currency,
      effective_date: effectiveDate,
      status,
      notes: raw.notes || null,
      channel_id: channelId,
      model_id: modelId,
      existing: existingKey.has(`${channelId}::${modelId}`),
    })
  })

  return { valid, errors }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { csv, commit } = await request.json()

    if (typeof csv !== 'string' || csv.trim() === '') {
      return NextResponse.json({ error: 'CSV 内容为空' }, { status: 400 })
    }

    const { valid, errors } = await analyze(csv)

    if (!commit) {
      return NextResponse.json({
        preview: true,
        validCount: valid.length,
        errorCount: errors.length,
        rows: valid.map((v) => ({
          line: v.line,
          provider_slug: v.provider_slug,
          channel_name: v.channel_name,
          model_slug: v.model_slug,
          price_input: v.price_input,
          price_output: v.price_output,
          rate: v.rate,
          currency: v.currency,
          effective_date: v.effective_date,
          status: v.status,
          action: v.existing ? '更新' : '新增',
        })),
        errors,
      })
    }

    if (valid.length === 0) {
      return NextResponse.json(
        { error: '没有可导入的有效行', errors },
        { status: 400 }
      )
    }

    const payload = valid.map((v) => ({
      channel_id: v.channel_id,
      model_id: v.model_id,
      price_input: v.price_input,
      price_output: v.price_output,
      rate: v.rate,
      currency: v.currency,
      effective_date: v.effective_date,
      status: v.status,
      notes: v.notes,
      verified_at: new Date().toISOString(),
      created_by: user.id,
      updated_by: user.id,
    }))

    const { data, error } = await supabase
      .from('prices')
      .upsert(payload, { onConflict: 'channel_id,model_id' })
      .select('id')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await logAction({
      action: 'import_prices_csv',
      resourceType: 'price',
      details: { imported: data?.length ?? 0, skipped: errors.length },
    })

    return NextResponse.json({
      committed: true,
      imported: data?.length ?? 0,
      skipped: errors.length,
      errors,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
