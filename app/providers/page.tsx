import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SITE_NAME, DEFAULT_PAGE_SIZE } from '@/lib/constants'
import { generateSEOMetadata, generateBreadcrumbSchema, generateItemListSchema } from '@/lib/seo'
import { Header, Footer } from '@/components/layout/PublicLayout'
import { Badge, Pagination } from '@/components/ui'

interface ProvidersPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

export async function generateMetadata({ searchParams }: ProvidersPageProps): Promise<Metadata> {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search

  // 有筛选参数的页面不索引
  const noindex = !!search || page > 1

  let title = '中转站排行榜'
  let description = '精选优质 AI API 中转站，人工核验，价格透明，帮您找到最适合的服务商'

  if (search) {
    title = `搜索: ${search} - 中转站排行榜`
    description = `搜索"${search}"相关的 AI API 中转站`
  } else if (page > 1) {
    title = `中转站排行榜 - 第 ${page} 页`
  }

  return generateSEOMetadata({
    title,
    description,
    path: '/providers',
    noindex,
  })
}

export const revalidate = 300 // ISR: 5分钟

export default async function ProvidersPage({ searchParams }: ProvidersPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search?.trim()
  const supabase = await createClient()

  // 查询总数
  let countQuery = supabase
    .from('providers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  if (search) {
    countQuery = countQuery.or(`name.ilike.%${search}%,name_en.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { count } = await countQuery

  // 查询数据
  const from = (page - 1) * DEFAULT_PAGE_SIZE
  const to = from + DEFAULT_PAGE_SIZE - 1

  let dataQuery = supabase
    .from('providers')
    .select('id, slug, name, name_en, description, features, is_recommended, verified_at, min_topup, trial_credit')
    .eq('status', 'published')

  if (search) {
    dataQuery = dataQuery.or(`name.ilike.%${search}%,name_en.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data: providers } = await dataQuery
    .order('is_recommended', { ascending: false })
    .order('sort_order', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count || 0) / DEFAULT_PAGE_SIZE)

  // 结构化数据
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: '首页', url: '/' },
    { name: '中转站排行榜', url: '/providers' },
  ])

  const itemListSchema = providers
    ? generateItemListSchema({
        name: '中转站排行榜',
        description: '精选优质 AI API 中转站列表',
        url: '/providers',
        items: providers.map((p) => ({
          name: p.name,
          url: `/providers/${p.slug}`,
          description: p.description || undefined,
        })),
      })
    : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}

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
                <li className="text-gray-900">中转站排行榜</li>
              </ol>
            </nav>

            {/* 标题和搜索 */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">中转站排行榜</h1>
              <p className="text-gray-600 mb-6">
                已收录 {count || 0} 家 AI API 中转站，所有数据均由人工核验
              </p>

              {/* 搜索框 */}
              <form method="GET" action="/providers" className="max-w-md">
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="搜索中转站名称..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    搜索
                  </button>
                </div>
              </form>

              {search && (
                <div className="mt-4">
                  <Link
                    href="/providers"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    ← 清除搜索
                  </Link>
                </div>
              )}
            </div>

            {/* 服务商列表 */}
            {providers && providers.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 mb-8">
                  {providers.map((provider) => (
                    <article
                      key={provider.id}
                      className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Link
                              href={`/providers/${provider.slug}`}
                              className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              <h2>{provider.name}</h2>
                            </Link>
                            {provider.is_recommended && (
                              <Badge variant="success">推荐</Badge>
                            )}
                          </div>

                          {provider.name_en && (
                            <p className="text-sm text-gray-500 mb-3">{provider.name_en}</p>
                          )}

                          {provider.description && (
                            <p className="text-gray-600 mb-4">{provider.description}</p>
                          )}

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            {provider.min_topup && (
                              <div>
                                <span className="font-medium">最低充值:</span> {provider.min_topup}
                              </div>
                            )}
                            {provider.trial_credit && (
                              <div>
                                <span className="font-medium">赠送额度:</span> {provider.trial_credit}
                              </div>
                            )}
                            {provider.verified_at && (
                              <div>
                                <span className="font-medium">核验时间:</span>{' '}
                                {new Date(provider.verified_at).toLocaleDateString('zh-CN')}
                              </div>
                            )}
                          </div>

                          {provider.features && provider.features.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {provider.features.map((feature: string) => (
                                <span
                                  key={feature}
                                  className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <Link
                          href={`/providers/${provider.slug}`}
                          className="ml-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          查看详情
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>

                {/* 分页 - 客户端组件 */}
                {totalPages > 1 && (
                  <div className="flex justify-center">
                    <div className="flex gap-2">
                      {page > 1 && (
                        <Link
                          href={`/providers?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          上一页
                        </Link>
                      )}
                      <span className="px-4 py-2 text-gray-700">
                        第 {page} / {totalPages} 页
                      </span>
                      {page < totalPages && (
                        <Link
                          href={`/providers?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          下一页
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {search ? '未找到匹配的中转站' : '暂无数据'}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {search ? '试试其他搜索关键词' : '敬请期待'}
                </p>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
