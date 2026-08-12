import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()

  const [{ data: providers }, { data: articles }] = await Promise.all([
    supabase
      .from('providers')
      .select('id, slug, name, name_en, description, features, is_recommended, verified_at')
      .eq('status', 'published')
      .order('is_recommended', { ascending: false })
      .order('sort_order', { ascending: false })
      .limit(9), // 首页只显示9个，不是全部
    supabase
      .from('articles')
      .select('id, slug, title, summary, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6),
  ])

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
          {/* Hero Section */}
          <section className="bg-gradient-to-b from-blue-50 to-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  {SITE_NAME}
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed mb-4">
                  {SITE_DESCRIPTION}
                </p>
                <p className="text-sm text-gray-500">
                  站内数据均由<strong>人工录入并标注核验时间</strong>，不做自动抓取，也不展示未经核验的可用率。
                </p>
              </div>
            </div>
          </section>

          {/* 推荐中转站 */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">推荐中转站</h2>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {providers.map((provider) => (
                    <Link
                      key={provider.id}
                      href={`/providers/${provider.slug}`}
                      className="group block border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {provider.name}
                        </h3>
                        {provider.is_recommended && (
                          <Badge variant="success" size="sm">推荐</Badge>
                        )}
                      </div>

                      {provider.name_en && (
                        <p className="text-sm text-gray-500 mb-3">{provider.name_en}</p>
                      )}

                      {provider.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {provider.description}
                        </p>
                      )}

                      {provider.features && provider.features.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {provider.features.slice(0, 3).map((feature: string) => (
                            <span
                              key={feature}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}

                      {provider.verified_at && (
                        <p className="text-xs text-gray-400 mt-4">
                          核验时间: {new Date(provider.verified_at).toLocaleDateString('zh-CN')}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-12">暂无已发布的中转站</p>
              )}
            </div>
          </section>

          {/* 最新教程 */}
          {articles && articles.length > 0 && (
            <section className="py-16 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">最新教程</h2>
                  <Link
                    href="/articles"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    查看全部教程
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles.map((article) => (
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

          {/* 特色说明 */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">为什么选择我们</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">人工核验</h3>
                  <p className="text-gray-600">
                    所有数据由人工录入并定期核验，标注最后核验时间，确保信息准确性
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">价格透明</h3>
                  <p className="text-gray-600">
                    对比多家中转站的模型价格，帮助您找到性价比最高的选择
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">详细教程</h3>
                  <p className="text-gray-600">
                    提供详细的使用教程和对比评测，帮助您快速上手
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}
