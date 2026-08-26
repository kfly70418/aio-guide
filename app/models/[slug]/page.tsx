import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo'
import { Header, Footer } from '@/components/layout/PublicLayout'

export const revalidate = 300

type PriceChannel = {
  id: string
  name: string
  is_primary: boolean | null
  provider: {
    id: string
    slug: string
    name: string
    status: string
    is_recommended: boolean | null
    min_topup: string | null
    coupon_code: string | null
  }
}

function getPriceChannel(price: { channel: unknown }) {
  return price.channel as PriceChannel | null
}

async function getModel(slug: string) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('models')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  return data
}

async function getPublishedModelPrices(modelId: string) {
  const supabase = createPublicClient()
  const { data: prices } = await supabase
    .from('prices')
    .select(
      `
      id, price_input, price_output, currency, verified_at, notes,
      channel:channels!inner(
        id, name, is_primary,
        provider:providers!inner(id, slug, name, status, is_recommended, min_topup, coupon_code)
      )
    `
    )
    .eq('model_id', modelId)
    .eq('status', 'active')

  type Row = NonNullable<typeof prices>[number]
  return ((prices ?? []) as Row[])
    .filter(price => getPriceChannel(price)?.provider.status === 'published')
    .sort((a, b) => Number(a.price_input) - Number(b.price_input))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const model = await getModel(slug)

  if (!model) {
    return generateSEOMetadata({
      title: '模型不存在',
      description: '未找到该模型',
      path: `/models/${slug}`,
      noindex: true,
    })
  }

  const rows = await getPublishedModelPrices(model.id)

  return generateSEOMetadata({
    title: `${model.name} 各中转站价格对比`,
    description:
      model.description ||
      `对比 ${model.name} 在各家 AI API 中转站的输入输出价格，逐条渠道直接比价，数据人工核验。`,
    path: `/models/${model.slug}`,
    noindex: rows.length === 0,
  })
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const model = await getModel(slug)

  if (!model) {
    notFound()
  }

  const rows = await getPublishedModelPrices(model.id)

  const lowestInput = rows.length > 0 ? Number(rows[0].price_input) : null

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: '首页', url: '/' },
    { name: '模型价格对比', url: '/models' },
    { name: model.name, url: `/models/${model.slug}` },
  ])

  const fmt = (v: number, currency: string) =>
    `${currency === 'CNY' ? '¥' : '$'}${Number(v).toFixed(2)}`

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        <main className="flex-1 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex mb-6 text-sm" aria-label="面包屑">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link href="/" className="text-gray-500 hover:text-blue-600">
                    首页
                  </Link>
                </li>
                <li>
                  <span className="text-gray-400 mx-2">/</span>
                </li>
                <li>
                  <Link href="/models" className="text-gray-500 hover:text-blue-600">
                    模型价格对比
                  </Link>
                </li>
                <li>
                  <span className="text-gray-400 mx-2">/</span>
                </li>
                <li className="text-gray-900">{model.name}</li>
              </ol>
            </nav>

            {/* 头部 */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">{model.name}</h1>
                {model.family && (
                  <span className="px-2.5 py-1 text-sm bg-gray-100 text-gray-700 rounded">
                    {model.family}
                  </span>
                )}
              </div>

              {model.description && (
                <p className="text-gray-700 leading-relaxed mb-4">{model.description}</p>
              )}

              <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                {model.provider_official && (
                  <div>
                    <dt className="inline text-gray-500">官方提供商：</dt>
                    <dd className="inline font-medium text-gray-900">{model.provider_official}</dd>
                  </div>
                )}
                {model.official_price_input != null && (
                  <div>
                    <dt className="inline text-gray-500">官方输入价：</dt>
                    <dd className="inline font-medium text-gray-900">
                      ${Number(model.official_price_input).toFixed(2)} /M
                    </dd>
                  </div>
                )}
                {model.official_price_output != null && (
                  <div>
                    <dt className="inline text-gray-500">官方输出价：</dt>
                    <dd className="inline font-medium text-gray-900">
                      ${Number(model.official_price_output).toFixed(2)} /M
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="inline text-gray-500">收录报价：</dt>
                  <dd className="inline font-medium text-gray-900">{rows.length} 条</dd>
                </div>
              </dl>
            </div>

            {/* 支持的服务商 */}
            {rows.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">支持该模型的服务商</h2>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(
                    rows
                      .map(row => getPriceChannel(row)?.provider.slug)
                      .filter((slug): slug is string => Boolean(slug))
                  )).map((slug) => {
                    const provider = getPriceChannel(
                      rows.find(row => getPriceChannel(row)?.provider.slug === slug)!
                    )?.provider
                    if (!provider) return null
                    return (
                      <Link
                        key={slug}
                        href={`/providers/${slug}`}
                        className="inline-flex items-center px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-sm text-green-700 hover:text-green-800 transition-colors"
                      >
                        {provider.name}
                      </Link>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  点击服务商名称查看详细信息和完整价格列表
                </p>
              </section>
            )}

            {/* 报价表 */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">各中转站报价</h2>

              {rows.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            服务商
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            渠道
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            输入价
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            输出价
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            核验时间
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rows.map((price) => {
                          const channel = getPriceChannel(price)
                          const provider = channel?.provider
                          const isLowest =
                            lowestInput != null && Number(price.price_input) === lowestInput

                          return (
                            <tr
                              key={price.id}
                              className={isLowest ? 'bg-green-50' : 'hover:bg-gray-50'}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/providers/${provider?.slug}`}
                                    className="font-medium text-gray-900 hover:text-blue-600"
                                  >
                                    {provider?.name}
                                  </Link>
                                  {isLowest && (
                                    <span className="px-1.5 py-0.5 text-xs font-medium bg-green-600 text-white rounded">
                                      最低价
                                    </span>
                                  )}
                                </div>
                                {provider?.coupon_code && (
                                  <p className="text-xs text-orange-600 mt-0.5">
                                    优惠码 {provider.coupon_code}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {channel?.name || '—'}
                                {channel?.is_primary && (
                                  <span className="ml-1.5 text-xs text-blue-600">主渠道</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={
                                    isLowest ? 'font-semibold text-green-700' : 'text-gray-900'
                                  }
                                >
                                  {fmt(Number(price.price_input), price.currency)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-900">
                                {fmt(Number(price.price_output), price.currency)}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500">
                                {price.verified_at
                                  ? new Date(price.verified_at).toLocaleDateString('zh-CN')
                                  : '待核验'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    * 价格单位：每百万 token（1M tokens）。同一服务商可能有多条渠道，价格与稳定性各异。
                    数据由人工录入，以服务商官网实际计费为准。
                  </p>
                </>
              ) : (
                <p className="text-gray-500 py-8 text-center">
                  该模型暂无收录报价，
                  <Link href="/providers" className="text-blue-600 hover:underline">
                    浏览全部中转站
                  </Link>
                </p>
              )}
            </section>

            <div className="text-center">
              <Link
                href="/models"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <span aria-hidden="true">←</span>
                返回模型列表
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
