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
    '精选 AI API 中转站排行榜：逐家对比基础核验、价格水平、起充金额、赠送额度、退款政策与开票支持。数据人工整理并标注核验时间。',
  path: '/providers',
  locale: 'zh',
  alternateUrls: [{ locale: 'ru', url: '/ru/providers' }],
})

export const revalidate = 300

export default async function ProvidersPage() {
  const supabase = createPublicClient()

  const query = supabase
    .from('providers')
    .select(
      `id, slug, name, description, features, is_recommended, sort_order, verified_at,
       price_level, min_topup, trial_credit, refund_policy, invoice_policy,
       invoice_support, verification_status, website_url`
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
    const channel = row.channel as unknown as { provider_id?: string } | null
    const providerId = channel?.provider_id
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
    verification_status: p.verification_status,
    verified_at: p.verified_at,
    website_url: p.website_url,
    description: p.description,
    features: p.features,
    is_recommended: p.is_recommended,
    families: [...(providerFamilies.get(p.id) ?? [])],
  }))

  const latestVerifiedAt = rows.reduce<string | null>((latest, provider) => {
    if (!provider.verified_at) return latest
    if (!latest || new Date(provider.verified_at) > new Date(latest)) return provider.verified_at
    return latest
  }, null)

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
                服务商资料与价格由人工录入，定期自动检查网站可访问性
                <span className="mx-2 text-gray-300">·</span>
                最近核验 {latestVerifiedAt ? new Date(latestVerifiedAt).toLocaleDateString('zh-CN') : '待核验'}
              </p>
            </div>

            {/* 排行榜表格（含搜索和模型筛选） */}
            <ProvidersClient providers={rows} />

            {/* 说明 */}
            <div className="mt-6 p-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 leading-relaxed">
              <p className="mb-1">
                <strong className="text-gray-900">关于本榜单：</strong>
                默认排序综合参考编辑推荐、价格水平、起充门槛、赠送额度、退款与开票政策，以及公开资料。
                「基础核验」表示网站可访问性及公开资料近期完成检查，不等同于持续性能、缓存命中或扣费准确性测试。
              </p>
              <p>
                服务商资料与价格由人工录入，网站可访问性由定时任务检查。
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
