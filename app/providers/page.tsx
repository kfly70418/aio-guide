import Link from 'next/link'
import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { generateSEOMetadata, generateBreadcrumbSchema, generateItemListSchema } from '@/lib/seo'
import { Header, Footer } from '@/components/layout/PublicLayout'
import { ProvidersClient, type RankingProvider } from './ProvidersClient'
import { sortProvidersByLocale } from '@/lib/provider-order'

export const metadata: Metadata = generateSEOMetadata({
  title: 'AI API 中转站排行榜',
  description:
    '精选 AI API 中转站排行榜：逐家对比模型真假检测、价格水平、起充金额、赠送额度、退款政策与开票支持。数据人工核验并标注核验时间。',
  path: '/providers',
})

export const revalidate = 300

const FAMILY_ORDER = ['GPT', 'Claude', 'Gemini', 'Grok']
const FAMILY_LABEL: Record<string, string> = {
  GPT: 'OPENAI',
  Claude: 'CLAUDE',
  Gemini: 'GEMINI',
  Grok: 'GROK',
}

export default async function ProvidersPage() {
  const supabase = createPublicClient()

  const query = supabase
    .from('providers')
    .select(
      `id, slug, name, description, features, is_recommended, sort_order, verified_at,
       price_level, min_topup, trial_credit, refund_policy, invoice_policy,
       invoice_support, coupon_note, coupon_code, verification_status, website_url`
    )
    .eq('status', 'published')

  const [{ data: providers }, { data: models }, { data: priceRows }] = await Promise.all([
    query.order('is_recommended', { ascending: false }).order('sort_order', { ascending: false }),
    supabase
      .from('models')
      .select('id, slug, name, family')
      .eq('status', 'published')
      .order('sort_order', { ascending: false }),
    // 为每家服务商推导覆盖的模型家族，供筛选使用
    supabase
      .from('prices')
      .select('model_id, channel:channels!inner(provider_id)')
      .eq('status', 'active'),
  ])

  // model_id → family
  const modelFamily = new Map<string, string>()
  for (const m of models ?? []) {
    if (m.family) modelFamily.set(m.id, m.family)
  }

  // provider_id → Set<family>
  const providerFamilies = new Map<string, Set<string>>()
  for (const row of priceRows ?? []) {
    const providerId = (row.channel as any)?.provider_id
    const family = row.model_id ? modelFamily.get(row.model_id) : undefined
    if (!providerId || !family) continue
    if (!providerFamilies.has(providerId)) providerFamilies.set(providerId, new Set())
    providerFamilies.get(providerId)!.add(family)
  }

  const rows: RankingProvider[] = sortProvidersByLocale(providers ?? [], 'zh').map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price_level: p.price_level,
    min_topup: p.min_topup,
    trial_credit: p.trial_credit,
    refund_policy: p.refund_policy,
    invoice_policy: p.invoice_policy,
    invoice_support: p.invoice_support,
    coupon_note: p.coupon_note,
    coupon_code: p.coupon_code,
    verification_status: p.verification_status,
    website_url: p.website_url,
    description: p.description,
    features: p.features,
    is_recommended: p.is_recommended,
    families: [...(providerFamilies.get(p.id) ?? [])],
  }))

  // 顶部模型比价分组
  const modelGroups = FAMILY_ORDER.map((family) => ({
    family,
    label: FAMILY_LABEL[family] ?? family.toUpperCase(),
    items: (models ?? []).filter((m) => m.family === family),
  })).filter((g) => g.items.length > 0)

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: '首页', url: '/' },
    { name: '中转站排行榜', url: '/providers' },
  ])

  const itemListSchema = generateItemListSchema({
    name: 'AI API 中转站排行榜',
    description: '精选优质 AI API 中转站列表',
    url: '/providers',
    items: rows.map((p) => ({
      name: p.name,
      url: `/providers/${p.slug}`,
      description: p.description || undefined,
    })),
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        <main className="flex-1 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* 面包屑 */}
            <nav className="flex mb-5 text-sm" aria-label="面包屑">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link href="/" className="text-gray-500 hover:text-blue-600">
                    首页
                  </Link>
                </li>
                <li>
                  <span className="text-gray-400 mx-2">/</span>
                </li>
                <li className="text-gray-900">中转站排行榜</li>
              </ol>
            </nav>

            {/* 标题区 */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                AI API 中转站 <span className="text-blue-600">排行榜</span>
              </h1>
              <p className="text-sm text-gray-600">
                给 AI 使用者选中转站：比价格、看模型真假
                <span className="mx-2 text-gray-300">·</span>
                人工录入并标注核验时间，不做自动抓取
                <span className="mx-2 text-gray-300">·</span>
                最近核验 {new Date().toLocaleDateString('zh-CN')}
              </p>
            </div>

            {/* 模型详细比价 */}
            {modelGroups.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                    特色
                  </span>
                  <h2 className="text-lg font-bold text-gray-900">模型详细比价</h2>
                  <span className="text-xs text-gray-500">
                    同一个模型，每家中转站每条渠道直接比 · 价格透明
                  </span>
                </div>

                <div className="space-y-3">
                  {modelGroups.map((group) => (
                    <div key={group.family} className="flex flex-wrap items-center gap-2">
                      <span className="w-16 shrink-0 text-xs font-medium text-gray-400 tracking-wider">
                        {group.label}
                      </span>
                      {group.items.map((model) => (
                        <Link
                          key={model.id}
                          href={`/models/${model.slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          {model.name}
                          <span aria-hidden="true" className="text-gray-400">
                            →
                          </span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 排行榜表格（含搜索和模型筛选） */}
            <ProvidersClient providers={rows} />

            {/* 说明 */}
            <div className="mt-6 p-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 leading-relaxed">
              <p className="mb-1">
                <strong className="text-gray-900">关于本榜单：</strong>
                排序综合参考价格水平、起充门槛、赠送额度、退款与开票政策，以及第三方榜单排名。
                「模型真假检测」指该服务商提供的模型经人工抽查确认为官方模型，非替换或降级版本。
              </p>
              <p>
                所有数据由人工录入并标注核验时间，本站不做实时监控或自动抓取。
                价格与政策随时可能变动，请以服务商官网实际计费为准。带优惠码的服务商与本站存在推广合作，详见
                <Link href="/disclosure" className="text-blue-600 hover:underline mx-1">
                  商业合作披露
                </Link>
                。
              </p>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
