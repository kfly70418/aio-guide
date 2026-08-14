import Link from 'next/link'
import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo'
import { Header, Footer } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

interface ArticlesPageProps {
  searchParams: Promise<{
    page?: string
    category?: string
  }>
}

export async function generateMetadata({ searchParams }: ArticlesPageProps): Promise<Metadata> {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const category = params.category

  const noindex = !!category || page > 1

  let title = '使用教程'
  let description = 'AI API 中转站使用教程、对比评测和常见问题解答'

  if (category) {
    const categoryNames = {
      tutorial: '入门教程',
      guide: '使用指南',
      news: '行业资讯',
      faq: '常见问题',
    }
    title = `${categoryNames[category as keyof typeof categoryNames]} - 使用教程`
  } else if (page > 1) {
    title = `使用教程 - 第 ${page} 页`
  }

  return generateSEOMetadata({
    title,
    description,
    path: '/articles',
    noindex,
  })
}

export const revalidate = 3600 // ISR: 1小时（文章更新频率低）

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const category = params.category
  const supabase = createPublicClient()

  // 查询总数
  let countQuery = supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  if (category) {
    countQuery = countQuery.eq('category', category as 'tutorial' | 'guide' | 'news' | 'faq')
  }

  const { count } = await countQuery

  // 查询数据
  const from = (page - 1) * DEFAULT_PAGE_SIZE
  const to = from + DEFAULT_PAGE_SIZE - 1

  let dataQuery = supabase
    .from('articles')
    .select('id, slug, title, summary, category, published_at, cover_image_url')
    .eq('status', 'published')

  if (category) {
    dataQuery = dataQuery.eq('category', category as 'tutorial' | 'guide' | 'news' | 'faq')
  }

  const { data: articles } = await dataQuery
    .order('published_at', { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count || 0) / DEFAULT_PAGE_SIZE)

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: '首页', url: '/' },
    { name: '使用教程', url: '/articles' },
  ])

  const categoryNames = {
    tutorial: '入门教程',
    guide: '使用指南',
    news: '行业资讯',
    faq: '常见问题',
  }

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
                <li className="text-gray-900">使用教程</li>
              </ol>
            </nav>

            {/* 标题和分类 */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">使用教程</h1>
              <p className="text-gray-600 mb-6">
                已收录 {count || 0} 篇教程文章
              </p>

              {/* 分类筛选 */}
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/articles"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  全部
                </Link>
                {Object.entries(categoryNames).map(([key, name]) => (
                  <Link
                    key={key}
                    href={`/articles?category=${key}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      category === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </div>

            {/* 文章列表 */}
            {articles && articles.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {articles.map((article) => (
                    <article
                      key={article.id}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-md transition-all"
                    >
                      <Link href={`/articles/${article.slug}`}>
                        {article.cover_image_url && (
                          <div className="aspect-video bg-gray-100 overflow-hidden">
                            <img
                              src={article.cover_image_url}
                              alt={article.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-6">
                          {article.category && (
                            <Badge variant="info" size="sm" className="mb-3">
                              {categoryNames[article.category as keyof typeof categoryNames]}
                            </Badge>
                          )}
                          <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                            {article.title}
                          </h2>
                          {article.summary && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                              {article.summary}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            {article.published_at && (
                              <time dateTime={article.published_at}>
                                {new Date(article.published_at).toLocaleDateString('zh-CN')}
                              </time>
                            )}
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="flex justify-center">
                    <div className="flex gap-2">
                      {page > 1 && (
                        <Link
                          href={`/articles?page=${page - 1}${category ? `&category=${category}` : ''}`}
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
                          href={`/articles?page=${page + 1}${category ? `&category=${category}` : ''}`}
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  暂无文章
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  该分类下暂无已发布的文章
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
