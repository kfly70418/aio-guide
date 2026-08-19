import Link from 'next/link'
import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from '@/lib/constants'
import { generateSEOMetadata, generateOrganizationSchema, generateWebSiteSchema } from '@/lib/seo'
import { Header, Footer } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui'

export const metadata: Metadata = generateSEOMetadata({
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  path: '/',
})

export const revalidate = 300 // ISR: 5分钟

export default async function HomePage() {
  const supabase = createPublicClient()

  const [{ data: providers }, { data: tutorials }, { data: news }, { data: models }] = await Promise.all([
    supabase
      .from('providers')
      .select(
        'id, slug, name, name_en, description, features, is_recommended, verified_at, min_topup, trial_credit, transaction_fee, invoice_support, verification_status'
      )
      .eq('status', 'published')
      .order('is_recommended', { ascending: false })
      .order('sort_order', { ascending: false })
      .limit(10), // 前3张卡片 + 后续列表
    supabase
      .from('articles')
      .select('id, slug, title, summary, published_at')
      .eq('status', 'published')
      .eq('category', 'tutorial')
      .order('published_at', { ascending: false })
      .limit(6),
    supabase
      .from('articles')
      .select('id, slug, title, summary, published_at')
      .eq('status', 'published')
      .eq('category', 'news')
      .order('published_at', { ascending: false })
      .limit(8),
    supabase
      .from('models')
      .select('id, slug, name, family, sort_order')
      .eq('status', 'published')
      .order('sort_order', { ascending: false }),
  ])

  // 按家族分组模型，用于顶部比价筛选区
  const FAMILY_ORDER = ['GPT', 'Claude', 'Gemini', 'Grok']
  const FAMILY_LABEL: Record<string, string> = {
    GPT: 'OPENAI',
    Claude: 'CLAUDE',
    Gemini: 'GEMINI',
    Grok: 'GROK',
  }
  const modelGroups = FAMILY_ORDER.map((family) => ({
    family,
    label: FAMILY_LABEL[family] ?? family.toUpperCase(),
    items: (models ?? []).filter((m) => m.family === family),
  })).filter((g) => g.items.length > 0)

  const topThree = (providers ?? []).slice(0, 3)
  const restProviders = (providers ?? []).slice(3)

  const organizationSchema = generateOrganizationSchema()
  const websiteSchema = generateWebSiteSchema()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <div className="min-h-screen flex flex-col bg-white">
        <Header />

        <main className="flex-1">
          {/* Hero + 模型比价入口 */}
          <section className="bg-gradient-to-b from-blue-50 to-white pt-8 pb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                AI API 中转站 <span className="text-blue-600">精选导航</span>
              </h1>
              <p className="text-sm text-gray-600 mb-5">
                给 AI 使用者选中转站：比价格、看模型真假
                <span className="mx-2 text-gray-300">·</span>
                人工录入并标注核验时间，不做自动抓取
                <span className="mx-2 text-gray-300">·</span>
                最近核验 {new Date().toLocaleDateString('zh-CN')}
              </p>

              {/* 模型详细比价 */}
              {modelGroups.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
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
            </div>
          </section>

          {/* 热门榜单推荐 - 新增 SEO 导流模块 */}
          <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">🏆 热门榜单推荐</h2>
                <p className="text-sm text-gray-600">根据不同需求，精选最适合你的中转站</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                  href="/rankings/claude-api"
                  className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all"
                >
                  <div className="text-4xl mb-4">🤖</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600">
                    Claude 中转站推荐
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    支持 Opus 5 / Sonnet 5 最新模型，稳定可靠
                  </p>
                  <div className="flex items-center text-sm text-purple-600 font-medium">
                    查看榜单
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                <Link
                  href="/rankings/gpt-api"
                  className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-400 hover:shadow-lg transition-all"
                >
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600">
                    GPT 中转站推荐
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    已支持 GPT-5.6 最新版本，价格透明
                  </p>
                  <div className="flex items-center text-sm text-green-600 font-medium">
                    查看榜单
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                <Link
                  href="/rankings/cheap"
                  className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:shadow-lg transition-all"
                >
                  <div className="text-4xl mb-4">💰</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600">
                    便宜的中转站
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    高性价比推荐，最低 10 元起充
                  </p>
                  <div className="flex items-center text-sm text-orange-600 font-medium">
                    查看榜单
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                <Link
                  href="/rankings/stable"
                  className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all"
                >
                  <div className="text-4xl mb-4">🛡️</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600">
                    稳定的中转站
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    运营 1 年以上，用户口碑好
                  </p>
                  <div className="flex items-center text-sm text-blue-600 font-medium">
                    查看榜单
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                <Link
                  href="/rankings/domestic"
                  className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-red-400 hover:shadow-lg transition-all"
                >
                  <div className="text-4xl mb-4">🇨🇳</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600">
                    国内中转站
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    无需魔法，国内直连低延迟
                  </p>
                  <div className="flex items-center text-sm text-red-600 font-medium">
                    查看榜单
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                <Link
                  href="/faq"
                  className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:shadow-lg transition-all"
                >
                  <div className="text-4xl mb-4">❓</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600">
                    常见问题
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    15+ 问题快速解答，新手必看
                  </p>
                  <div className="flex items-center text-sm text-indigo-600 font-medium">
                    查看全部
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </div>
            </div>
          </section>

          {/* 推荐中转站 */}
          <section className="pt-8 pb-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">推荐中转站</h2>
                <Link
                  href="/providers"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  查看完整排行
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {providers && providers.length > 0 ? (
                <>
                  {/* 前三名：卡片 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topThree.map((provider) => (
                      <Link
                        key={provider.id}
                        href={`/providers/${provider.slug}`}
                        className="group block border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all bg-white"
                      >
                        {/* 头部：名称和推荐标签 */}
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {provider.name}
                          </h3>
                          {provider.is_recommended && (
                            <Badge variant="success" size="sm">⭐ 推荐</Badge>
                          )}
                        </div>

                        {/* 核心信息卡片 */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
                          <div className="grid grid-cols-2 gap-4">
                            {provider.min_topup && (
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">最低起充</div>
                                <div className="text-lg font-bold text-blue-600">{provider.min_topup}</div>
                              </div>
                            )}
                            {provider.trial_credit && (
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">新人赠送</div>
                                <div className="text-lg font-bold text-green-600">{provider.trial_credit}</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 底部：核验时间 */}
                        {provider.verified_at && (
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">
                              ✓ 核验时间: {new Date(provider.verified_at).toLocaleDateString('zh-CN')}
                            </span>
                            <span className="text-xs text-blue-500 group-hover:text-blue-600 font-medium">
                              查看详情 →
                            </span>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>

                  {/* 第四名起：紧凑列表 */}
                  {restProviders.length > 0 && (
                    <div className="mt-8 border border-gray-200 rounded-xl overflow-hidden">
                      {/* 表头（桌面端） */}
                      <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500">
                        <div className="col-span-4">服务商</div>
                        <div className="col-span-2">模型检测</div>
                        <div className="col-span-1">起充</div>
                        <div className="col-span-2">赠送额度</div>
                        <div className="col-span-2">退款政策</div>
                        <div className="col-span-1 text-right">开票</div>
                      </div>

                      <ul className="divide-y divide-gray-200">
                        {restProviders.map((provider) => (
                          <li key={provider.id}>
                            <Link
                              href={`/providers/${provider.slug}`}
                              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 items-center hover:bg-blue-50/50 transition-colors"
                            >
                              <div className="md:col-span-4 min-w-0">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {provider.name}
                                  </p>
                                  {/* 气泡标签显示 description */}
                                  {provider.description && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {provider.description.split('·').map((tag: string, index: number) => (
                                        <span
                                          key={index}
                                          className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200"
                                        >
                                          {tag.trim()}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="md:col-span-2">
                                {provider.verification_status === 'verified' ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    通过检测
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">待检测</span>
                                )}
                              </div>

                              <div className="md:col-span-1 text-xs text-gray-700">
                                <span className="md:hidden text-gray-500">起充 </span>
                                {provider.min_topup || '—'}
                              </div>

                              <div className="md:col-span-2 text-xs text-gray-700 truncate">
                                <span className="md:hidden text-gray-500">赠送 </span>
                                {provider.trial_credit || '—'}
                              </div>

                              <div className="md:col-span-2 text-xs text-gray-700 truncate">
                                <span className="md:hidden text-gray-500">费用 </span>
                                {provider.transaction_fee || '—'}
                              </div>

                              <div className="md:col-span-1 md:text-right text-xs">
                                <span className="md:hidden text-gray-500">开票 </span>
                                {provider.invoice_support ? '支持' : '—'}
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500 py-12">暂无已发布的中转站</p>
              )}
            </div>
          </section>

          {/* 特色说明 */}
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">为什么选择我们</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Link href="/methodology" className="text-center group">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">人工核验</h3>
                  <p className="text-gray-600">
                    所有数据由人工录入并定期核验，标注最后核验时间，确保信息准确性
                  </p>
                </Link>

                <Link href="/methodology" className="text-center group">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">价格透明</h3>
                  <p className="text-gray-600">
                    对比多家中转站的模型价格，帮助您找到性价比最高的选择
                  </p>
                </Link>

                <Link href="/articles" className="text-center group">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                    <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">详细教程</h3>
                  <p className="text-gray-600">
                    提供详细的使用教程和对比评测，帮助您快速上手
                  </p>
                </Link>
              </div>
            </div>
          </section>

          {/* 最新教程 */}
          {tutorials && tutorials.length > 0 && (
            <section className="py-12 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">最新教程</h2>
                  <Link
                    href="/articles?category=tutorial"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    查看全部教程
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tutorials.map((article) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      {article.summary && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                          {article.summary}
                        </p>
                      )}
                      {article.published_at && (
                        <p className="text-xs text-gray-400">
                          {new Date(article.published_at).toLocaleDateString('zh-CN')}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* AI快讯 */}
          <section className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 快讯</h2>
                  <p className="text-gray-600">AI 大模型、API 中转站最新动态和行业资讯</p>
                </div>
                <Link
                  href="/articles?category=news"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  查看全部资讯
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {news && news.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {news.map((article, index) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className={`block border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all ${
                        index === 0 ? 'md:col-span-2 bg-gradient-to-br from-blue-50 to-white' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {index === 0 && (
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-lg font-bold text-lg">
                              热
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {/* 只有当天的内容才显示"最新"标签 */}
                            {article.published_at && (() => {
                              const publishDate = new Date(article.published_at)
                              const today = new Date()
                              const isToday = publishDate.toDateString() === today.toDateString()
                              return isToday ? (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                                  最新
                                </span>
                              ) : null
                            })()}
                            {article.published_at && (
                              <time className="text-xs text-gray-500" dateTime={article.published_at}>
                                {new Date(article.published_at).toLocaleDateString('zh-CN', {
                                  month: 'numeric',
                                  day: 'numeric'
                                })}
                              </time>
                            )}
                          </div>
                          <h3 className={`font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors ${
                            index === 0 ? 'text-xl' : 'text-base'
                          }`}>
                            {article.title}
                          </h3>
                          {article.summary && (
                            <p className={`text-gray-600 line-clamp-2 ${
                              index === 0 ? 'text-base' : 'text-sm'
                            }`}>
                              {article.summary}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-12">暂无快讯</p>
              )}

              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">关注 AI 行业动态</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  我们持续关注 <strong>ChatGPT API</strong>、<strong>Claude API</strong>、<strong>GPT 5.6 Sol</strong>、
                  <strong>GPT 5.6 Terra</strong>、<strong>Claude Opus 5</strong> 等主流 AI 大模型的价格变动和服务更新。
                  实时追踪各大 <strong>AI API 中转站</strong>、<strong>OpenAI 中转</strong>、<strong>Claude 中转</strong> 的
                  优惠活动、充值折扣和服务稳定性。为开发者提供最新的 <strong>API 价格对比</strong>、
                  <strong>中转站评测</strong>、<strong>使用教程</strong> 和 <strong>避坑指南</strong>，
                  帮助您选择性价比最高、最稳定可靠的 <strong>AI API 服务商</strong>。
                </p>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}
