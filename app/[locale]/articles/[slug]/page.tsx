import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createPublicClient } from '@/lib/supabase/public'
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo'
import { generateRuArticleSchema, generateRuBreadcrumbSchema } from '@/lib/seo-ru'
import { Header, Footer } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui'
import Breadcrumb from '@/components/Breadcrumb'
import { getDictionary } from '@/lib/i18n/utils'
import { locales, type Locale } from '@/lib/i18n/config'
import { getTranslatedArticle } from '@/lib/i18n/translated-data'
import '../russian-typography.css'

export const revalidate = 3600

export async function generateMetadata({
  params
}: {
  params: { locale: string; slug: string }
}): Promise<Metadata> {
  const { locale, slug } = await params
  const article = await getTranslatedArticle(slug, locale as Locale)

  if (!article) {
    return {}
  }

  const dict = getDictionary(locale as Locale)

  // 生成多语言链接
  const alternateUrls = locales
    .filter(l => l !== locale)
    .map(l => ({
      locale: l,
      url: l === 'zh' ? `/articles/${slug}` : `/${l}/articles/${slug}`
    }))

  return generateSEOMetadata({
    title: `${article.title} - ${dict.articles.title}`,
    description: article.summary || '',
    path: `/${locale === 'zh' ? '' : locale + '/'}articles/${slug}`,
    locale: locale,
    alternateUrls,
    type: 'article',
    noindex: article.category === 'news',
    publishedTime: article.published_at || article.created_at,
    modifiedTime: article.updated_at,
    image: article.cover_image_url || undefined,
    siteName: dict.common.site_name,
  })
}

export default async function ArticleDetailPage({
  params
}: {
  params: { locale: string; slug: string }
}) {
  const { locale, slug } = await params

  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const dict = getDictionary(locale as Locale)
  const basePath = locale === 'zh' ? '' : `/${locale}`
  const supabase = createPublicClient()

  // 获取翻译后的文章数据
  const article = await getTranslatedArticle(slug, locale as Locale)

  if (!article) {
    notFound()
  }

  // 更新浏览次数
  await supabase
    .from('articles')
    .update({ view_count: (article.view_count || 0) + 1 })
    .eq('id', article.id)

  // 获取相关文章
  const { data: relatedArticles } = await supabase
    .from('articles')
    .select('id, slug, title, summary, category, published_at')
    .eq('status', 'published')
    .eq('category', article.category)
    .neq('id', article.id)
    .order('published_at', { ascending: false })
    .limit(3)

  // 翻译相关文章
  let translatedRelatedArticles = relatedArticles || []
  if (locale !== 'zh' && relatedArticles) {
    const { getBatchTranslations } = await import('@/lib/i18n/translations')
    const relatedIds = relatedArticles.map(a => a.id)
    const translationsMap = await getBatchTranslations('article', relatedIds, locale as Locale)

    translatedRelatedArticles = relatedArticles
      .filter(article => {
        const translations = translationsMap.get(article.id)
        return translations && translations.title
      })
      .map(article => {
        const translations = translationsMap.get(article.id)!
        return {
          ...article,
          title: translations.title || article.title,
          summary: translations.summary || article.summary,
        }
      })
  }

  const articleUrl = `${basePath}/articles/${slug}`
  const breadcrumbSchema = locale === 'ru'
    ? generateRuBreadcrumbSchema([
        { name: dict.nav.home, url: 'https://www.apixuan.com/ru' },
        { name: dict.articles.title, url: 'https://www.apixuan.com/ru/articles' },
        { name: article.title, url: `https://www.apixuan.com${articleUrl}` },
      ])
    : generateBreadcrumbSchema([
        { name: dict.nav.home, url: '/' },
        { name: dict.articles.title, url: '/articles' },
        { name: article.title, url: articleUrl },
      ])
  const articleSchema = locale === 'ru'
    ? generateRuArticleSchema({
        title: article.title,
        description: article.summary || '',
        url: `https://www.apixuan.com${articleUrl}`,
        image: article.cover_image_url || undefined,
        datePublished: article.published_at || article.created_at,
        dateModified: article.updated_at || article.published_at || article.created_at,
      })
    : undefined

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {articleSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />}
      <div className="min-h-screen flex flex-col bg-white">
        <Header locale={locale as Locale} dict={dict} />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumb
              items={[
                { label: dict.nav.home, href: `${basePath}/` },
                { label: dict.articles.title, href: `${basePath}/articles` },
                { label: article.title },
              ]}
            />

            {/* 文章头部 */}
            <article className="mb-12">
              <header className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" size="sm">
                    {dict.articles.categories[article.category as keyof typeof dict.articles.categories] || article.category}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {dict.articles.published_at}: {article.published_at ? new Date(article.published_at).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'ru-RU') : '-'}
                  </span>
                  <span className="text-sm text-gray-500">
                    • {article.view_count || 0} {dict.articles.views}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  {article.title}
                </h1>

                {article.summary && (
                  <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                    {article.summary}
                  </p>
                )}
              </header>

              {/* 封面图 */}
              {article.cover_image_url && (
                <div className="mb-8 rounded-lg overflow-hidden">
                  <img
                    src={article.cover_image_url}
                    alt={article.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {/* 文章内容 */}
              <div
                className="prose prose-lg max-w-none min-w-0 prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:max-w-full prose-pre:overflow-x-auto prose-pre:bg-gray-900 prose-pre:text-gray-100"
                style={locale === 'ru' ? {
                  lineHeight: '1.75',
                  textAlign: 'justify' as const,
                  hyphens: 'auto' as const,
                } : {}}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    pre: ({ children }) => (
                      <pre className="max-w-full overflow-x-auto bg-gray-900 p-4 text-sm text-gray-100 rounded-lg">
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {article.content || ''}
                </ReactMarkdown>
              </div>

              {/* 文章底部信息 */}
              <footer className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div>
                    {dict.articles.published_at}: {article.published_at ? new Date(article.published_at).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : '-'}
                  </div>
                  {article.updated_at && article.updated_at !== article.published_at && (
                    <div>
                      最后更新: {new Date(article.updated_at).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'ru-RU')}
                    </div>
                  )}
                </div>
              </footer>
            </article>

            {/* 相关文章 */}
            {translatedRelatedArticles && translatedRelatedArticles.length > 0 && (
              <section className="border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {locale === 'zh' ? '相关文章' : 'Похожие статьи'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {translatedRelatedArticles.map((related) => (
                    <Link
                      key={related.id}
                      href={`${basePath}/articles/${related.slug}`}
                      className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all"
                    >
                      <Badge variant="secondary" size="sm" className="mb-2">
                        {dict.articles.categories[related.category as keyof typeof dict.articles.categories] || related.category}
                      </Badge>
                      <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-blue-600 line-clamp-2">
                        {related.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {related.summary}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 返回列表 */}
            <div className="text-center mt-8">
              <Link
                href={`${basePath}/articles`}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                ← {dict.common.back}
              </Link>
            </div>
          </div>
        </main>

        <Footer locale={locale as Locale} dict={dict} />
      </div>
    </>
  )
}
