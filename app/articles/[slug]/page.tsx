import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createPublicClient } from '@/lib/supabase/public'
import { generateSEOMetadata, generateBreadcrumbSchema, generateArticleSchema } from '@/lib/seo'
import { Header, Footer } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui'

export const revalidate = 3600 // ISR: 1小时（文章内容更新频率低）

const CATEGORY_LABEL: Record<string, string> = {
  tutorial: '入门教程',
  guide: '使用指南',
  news: '行业资讯',
  faq: '常见问题',
}

async function getArticle(slug: string) {
  const supabase = createPublicClient()

  // 解码 URL 编码的 slug（处理中文）
  const decodedSlug = decodeURIComponent(slug)

  const { data } = await supabase
    .from('articles')
    .select('*, provider:providers(name, slug)')
    .eq('slug', decodedSlug)
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
  const article = await getArticle(slug)

  if (!article) {
    return generateSEOMetadata({
      title: '文章不存在',
      description: '未找到该文章',
      path: `/articles/${slug}`,
      noindex: true,
    })
  }

  // 新闻类文章设置 noindex, follow（内容过于单薄）
  if (article.category === 'news') {
    return generateSEOMetadata({
      title: article.title,
      description: article.summary || article.title,
      path: `/articles/${article.slug}`,
      type: 'article',
      publishedTime: article.published_at || undefined,
      modifiedTime: article.updated_at,
      noindex: true,
    })
  }

  return generateSEOMetadata({
    title: article.title,
    description: article.summary || article.title,
    path: `/articles/${article.slug}`,
    type: 'article',
    publishedTime: article.published_at || undefined,
    modifiedTime: article.updated_at,
    image: article.cover_image_url || undefined,
  })
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    notFound()
  }

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: '首页', url: '/' },
    { name: '使用教程', url: '/articles' },
    { name: article.title, url: `/articles/${article.slug}` },
  ])

  const articleSchema = generateArticleSchema({
    title: article.title,
    description: article.summary || article.title,
    url: `/articles/${article.slug}`,
    publishedTime: article.published_at || new Date().toISOString(),
    modifiedTime: article.updated_at,
    image: article.cover_image_url || undefined,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        <main className="flex-1 py-8">
          <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  <Link href="/articles" className="text-gray-500 hover:text-blue-600">
                    使用教程
                  </Link>
                </li>
                <li>
                  <span className="text-gray-400 mx-2">/</span>
                </li>
                <li className="text-gray-900 line-clamp-1">{article.title}</li>
              </ol>
            </nav>

            {/* 文章头部 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-8 mb-6">
              {article.category && (
                <Badge variant="info" size="sm" className="mb-4">
                  {CATEGORY_LABEL[article.category] ?? article.category}
                </Badge>
              )}

              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>

              {article.summary && (
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">{article.summary}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 pt-4 border-t border-gray-200">
                {article.published_at && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>发布：{new Date(article.published_at).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                )}
                {article.updated_at && article.updated_at !== article.published_at && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>更新：{new Date(article.updated_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                )}
              </div>

              {article.provider && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    相关中转站：
                    <Link
                      href={`/providers/${article.provider.slug}`}
                      className="font-medium underline ml-2 hover:text-blue-700"
                    >
                      {article.provider.name}
                    </Link>
                  </p>
                </div>
              )}
            </div>

            {/* 文章内容 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-8 mb-6">
              <div className="prose prose-gray max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{children}</h2>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{children}</h3>
                    ),
                    p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                    ul: ({ children }) => (
                      <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-6">
                        <table className="w-full border-collapse text-sm">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-900">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-300 px-3 py-2 align-top text-gray-700">
                        {children}
                      </td>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-4 font-mono">
                        {children}
                      </pre>
                    ),
                    a: ({ href, children }) => {
                      const isTrusted = href && (
                        href.includes('openai.com') ||
                        href.includes('anthropic.com') ||
                        href.includes('google.com') ||
                        href.includes('deepseek.com') ||
                        href.includes('coze.com') ||
                        href.includes('github.com')
                      )
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel={`noopener noreferrer${isTrusted ? '' : ' nofollow'}`}
                          className="text-blue-600 hover:underline"
                        >
                          {children}
                        </a>
                      )
                    },
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-gray-700 italic">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {article.content}
                </ReactMarkdown>
              </div>

              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200">
                  <span className="text-sm text-gray-600 mr-2">标签：</span>
                  {article.tags.map((t: string) => (
                    <span
                      key={t}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 返回列表 */}
            <div className="text-center">
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                返回教程列表
              </Link>
            </div>
          </article>
        </main>

        <Footer />
      </div>
    </>
  )
}
