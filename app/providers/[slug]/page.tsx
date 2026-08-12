import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SITE_NAME } from '@/lib/constants'
import { generateSEOMetadata, generateBreadcrumbSchema, generateServiceSchema } from '@/lib/seo'
import { Header, Footer } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui'
import { isExpired } from '@/lib/utils'

export const revalidate = 300 // ISR: 5分钟

async function getProvider(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('providers')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  return data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const provider = await getProvider(slug)

  if (!provider) {
    return generateSEOMetadata({
      title: '页面不存在',
      description: '未找到该中转站',
      path: `/providers/${slug}`,
      noindex: true,
    })
  }

  const description = provider.description ||
    `${provider.name} 的详细评测，包括模型价格、支付方式、使用体验等信息。最后核验时间：${provider.verified_at ? new Date(provider.verified_at).toLocaleDateString('zh-CN') : '待核验'}。`

  return generateSEOMetadata({
    title: `${provider.name} 详细评测与价格对比`,
    description,
    path: `/providers/${provider.slug}`,
  })
}

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const provider = await getProvider(slug)

  if (!provider) {
    notFound()
  }

  const supabase = await createClient()

  // 查询价格信息（带模型和渠道）
  const { data: prices } = await supabase
    .from('prices')
    .select(`
      id, price_input, price_output, currency, verified_at, notes,
      channel:channels!inner(id, name, provider_id),
      model:models(name, family, slug)
    `)
    .eq('status', 'active')
    .eq('channel.provider_id', provider.id)
    .order('model(family)', { ascending: true })

  // 查询相关教程
  const { data: articles } = await supabase
    .from('articles')
    .select('id, slug, title, summary, published_at')
    .eq('status', 'published')
    .eq('related_provider_id', provider.id)
    .order('published_at', { ascending: false })
    .limit(5)

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: '首页', url: '/' },
    { name: '中转站排行榜', url: '/providers' },
    { name: provider.name, url: `/providers/${provider.slug}` },
  ])

  const serviceSchema = generateServiceSchema({
    name: provider.name,
    description: provider.description || `${provider.name} - AI API 中转服务`,
    url: `/providers/${provider.slug}`,
    provider: provider.name,
  })

  const verified = provider.verified_at
  const expired = verified && isExpired(verified)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        <main className="flex-1 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* 面包屑 */}
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
                  <Link href="/providers" className="text-gray-500 hover:text-blue-600">
                    中转站排行榜
                  </Link>
                </li>
                <li>
                  <span className="text-gray-400 mx-2">/</span>
                </li>
                <li className="text-gray-900">{provider.name}</li>
              </ol>
            </nav>

            {/* 标题区域 */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
              <div className="flex items-start justify-between gap-6 mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {provider.name}
                    {provider.is_recommended && (
                      <Badge variant="success" className="ml-3">推荐</Badge>
                    )}
                  </h1>
                  {provider.name_en && (
                    <p className="text-lg text-gray-500">{provider.name_en}</p>
                  )}
                </div>
                {provider.website_url && (
                  <a
                    href={provider.website_url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap font-medium"
                  >
                    访问官网
                  </a>
                )}
              </div>

              {provider.description && (
                <p className="text-gray-700 leading-relaxed mb-6">{provider.description}</p>
              )}

              {provider.features && provider.features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {provider.features.map((feature: string) => (
                    <span
                      key={feature}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 核验信息 */}
            <div className={`rounded-xl border p-4 mb-6 ${expired ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 text-sm">
                <svg className={`w-5 h-5 ${expired ? 'text-yellow-600' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={expired ? 'text-yellow-800 font-medium' : 'text-gray-700'}>
                  <strong>最后人工核验时间：</strong>
                  {verified ? new Date(verified).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '尚未核验'}
                  {expired && ' (已超过30天，数据可能过时)'}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                本站不做实时监控，所有信息由人工录入。价格请以服务商官网为准。
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 主要内容 */}
              <div className="lg:col-span-2 space-y-6">
                {/* 运营信息 */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">运营信息</h2>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {provider.min_topup && (
                      <div>
                        <dt className="text-gray-500 mb-1">最低充值</dt>
                        <dd className="text-gray-900 font-medium">{provider.min_topup}</dd>
                      </div>
                    )}
                    {provider.trial_credit && (
                      <div>
                        <dt className="text-gray-500 mb-1">注册赠送</dt>
                        <dd className="text-gray-900 font-medium">{provider.trial_credit}</dd>
                      </div>
                    )}
                    {provider.transaction_fee && (
                      <div>
                        <dt className="text-gray-500 mb-1">充值手续费</dt>
                        <dd className="text-gray-900 font-medium">{provider.transaction_fee}</dd>
                      </div>
                    )}
                    {provider.invoice_support !== null && (
                      <div>
                        <dt className="text-gray-500 mb-1">发票支持</dt>
                        <dd className="text-gray-900 font-medium">
                          {provider.invoice_support ? '支持' : '不支持'}
                        </dd>
                      </div>
                    )}
                    {provider.promo_code && (
                      <div>
                        <dt className="text-gray-500 mb-1">优惠码</dt>
                        <dd className="text-gray-900 font-medium font-mono">{provider.promo_code}</dd>
                      </div>
                    )}
                  </dl>
                </section>

                {/* 模型价格 */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">模型价格</h2>
                  {prices && prices.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                模型
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                输入价格
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                输出价格
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                核验时间
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {prices.map((price) => (
                              <tr key={price.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">
                                  {price.model?.name || '-'}
                                  {price.model?.family && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      ({price.model.family})
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {price.currency === 'CNY' ? '¥' : '$'}
                                  {Number(price.price_input).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {price.currency === 'CNY' ? '¥' : '$'}
                                  {Number(price.price_output).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500">
                                  {price.verified_at
                                    ? new Date(price.verified_at).toLocaleDateString('zh-CN')
                                    : '待核验'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        * 价格单位：每百万 token（1M tokens）
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500 py-8 text-center">暂无价格信息</p>
                  )}
                </section>

                {/* 相关教程 */}
                {articles && articles.length > 0 && (
                  <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">相关教程</h2>
                    <div className="space-y-3">
                      {articles.map((article) => (
                        <Link
                          key={article.id}
                          href={`/articles/${article.slug}`}
                          className="block border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-sm transition-all"
                        >
                          <h3 className="font-medium text-gray-900 mb-1">{article.title}</h3>
                          {article.summary && (
                            <p className="text-sm text-gray-600 line-clamp-2">{article.summary}</p>
                          )}
                          {article.published_at && (
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(article.published_at).toLocaleDateString('zh-CN')}
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* 侧边栏 */}
              <div className="space-y-6">
                {/* 风险提示 */}
                <aside className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    风险提示
                  </h3>
                  <ul className="text-xs text-yellow-800 space-y-2 leading-relaxed">
                    <li>• 使用第三方中转服务存在数据隐私风险</li>
                    <li>• 充值前请了解退款政策</li>
                    <li>• 价格和服务随时可能变动</li>
                    <li>• 本站不对服务质量负责</li>
                  </ul>
                </aside>

                {/* 商业披露 */}
                {provider.promo_code && (
                  <aside className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">商业合作</h3>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      本站与该服务商存在推广合作关系。通过本站链接注册可能带来推广收益。
                      详见<Link href="/disclosure" className="underline">商业合作披露</Link>。
                    </p>
                  </aside>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
