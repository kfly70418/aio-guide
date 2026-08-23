import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'
import { generateSEOMetadata } from '@/lib/seo'
import { ruKeywords } from '@/lib/seo-ru'
import { Header, Footer } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui'
import Breadcrumb from '@/components/Breadcrumb'
import { getDictionary } from '@/lib/i18n/utils'
import { locales, type Locale } from '@/lib/i18n/config'
import { getTranslatedArticles } from '@/lib/i18n/translated-data'

// 强制动态渲染
export const dynamic = 'force-dynamic'
export const revalidate = 0

export function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = await params
  const dict = getDictionary(locale as Locale)

  // 生成多语言链接
  const alternateUrls = locales
    .filter(l => l !== locale)
    .map(l => ({
      locale: l,
      url: l === 'zh' ? '/articles' : `/${l}/articles`
    }))

  return generateSEOMetadata({
    title: dict.articles.title,
    description: dict.articles.description,
    path: `/${locale === 'zh' ? '' : locale + '/'}articles`,
    locale: locale,
    alternateUrls,
    keywords: locale === 'ru' ? ruKeywords.articles.keywords : undefined,
    siteName: dict.common.site_name,
  })
}

export const revalidate = 600 // ISR: 10分钟

export default async function ArticlesPage({
  params,
  searchParams
}: {
  params: { locale: string }
  searchParams: { category?: string }
}) {
  const { locale } = await params
  const { category } = await searchParams

  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const dict = getDictionary(locale as Locale)
  const basePath = locale === 'zh' ? '' : `/${locale}`
  const supabase = createPublicClient()

  // 使用翻译辅助函数获取文章列表
  const validCategory = category as 'tutorial' | 'guide' | 'news' | 'faq' | undefined
  const articlesList = await getTranslatedArticles(locale as Locale, {
    limit: 50,
    category: validCategory
  })

  // 分类统计 - 对于非中文语言，只统计有翻译的文章
  let categoryCount: Record<string, number> = {}

  if (locale === 'zh') {
    // 中文站：统计所有文章
    const { data: categoriesData } = await supabase
      .from('articles')
      .select('category')
      .eq('status', 'published')

    categoryCount = (categoriesData || []).reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  } else {
    // 非中文站：获取所有文章并检查翻译
    const { data: allArticles } = await supabase
      .from('articles')
      .select('id, category')
      .eq('status', 'published')

    if (allArticles) {
      const articleIds = allArticles.map(a => a.id)

      // 批量获取翻译
      const { data: translations } = await supabase
        .from('translations')
        .select('resource_id, field')
        .eq('resource_type', 'article')
        .in('resource_id', articleIds)
        .eq('locale', locale)
        .eq('field', 'title')

      // 创建有翻译的文章ID集合
      const translatedIds = new Set(translations?.map(t => t.resource_id) || [])

      // 只统计有翻译的文章
      categoryCount = allArticles
        .filter(article => translatedIds.has(article.id))
        .reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1
          return acc
        }, {} as Record<string, number>)
    }
  }

  const categories = [
    { key: 'tutorial', label: dict.articles.categories.tutorial, count: categoryCount.tutorial || 0 },
    { key: 'guide', label: dict.articles.categories.guide, count: categoryCount.guide || 0 },
    { key: 'news', label: dict.articles.categories.news, count: categoryCount.news || 0 },
    { key: 'faq', label: dict.articles.categories.faq, count: categoryCount.faq || 0 },
  ]

  return (
    <>
      <div className="min-h-screen flex flex-col bg-white">
        <Header locale={locale as Locale} dict={dict} />

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumb
              items={[
                { label: dict.nav.home, href: `${basePath}/` },
                { label: dict.articles.title },
              ]}
            />

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {dict.articles.title}
              </h1>
              <p className="text-gray-600">
                {dict.articles.description}
              </p>
            </div>

            {/* 分类筛选 */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`${basePath}/articles`}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    !category
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {dict.common.all} ({Object.values(categoryCount).reduce((a, b) => a + b, 0)})
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.key}
                    href={`${basePath}/articles?category=${cat.key}`}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      category === cat.key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {cat.label} ({cat.count})
                  </Link>
                ))}
              </div>
            </div>

            {/* 文章列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articlesList.map((article) => (
                <Link
                  key={article.id}
                  href={`${basePath}/articles/${article.slug}`}
                  className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" size="sm">
                        {dict.articles.categories[article.category as keyof typeof dict.articles.categories] || article.category}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {article.published_at ? new Date(article.published_at).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'ru-RU') : '-'}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 line-clamp-2">
                      {article.title}
                    </h2>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                      {article.summary}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{dict.articles.views}: {article.view_count || 0}</span>
                      <span className="text-blue-600 group-hover:text-blue-700">
                        {dict.articles.read_more} →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {articlesList.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">{dict.articles.no_articles}</p>
              </div>
            )}
          </div>
        </main>

        <Footer locale={locale as Locale} dict={dict} />
      </div>
    </>
  )
}
