import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants'
import { generateSEOMetadata, generateOrganizationSchema, generateWebSiteSchema } from '@/lib/seo'
import { generateRuOrganizationSchema, ruKeywords } from '@/lib/seo-ru'
import { Header, Footer } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui'
import { getDictionary } from '@/lib/i18n/utils'
import { locales, type Locale } from '@/lib/i18n/config'
import { getTranslatedProviders, getTranslatedModels, getTranslatedArticles } from '@/lib/i18n/translated-data'
import { formatModelName } from '@/lib/format-model-name'

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
      url: l === 'zh' ? '/' : `/${l}`
    }))

  return generateSEOMetadata({
    title: dict.common.site_name,
    description: dict.common.site_description,
    path: `/${locale === 'zh' ? '' : locale}`,
    locale: locale,
    alternateUrls,
    keywords: locale === 'ru' ? ruKeywords.home.keywords : undefined,
    siteName: dict.common.site_name,
  })
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = await params

  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const dict = getDictionary(locale as Locale)
  const supabase = createPublicClient()

  // 获取翻译后的数据
  const [providers, tutorials, news, models] = await Promise.all([
    getTranslatedProviders(locale as Locale, { limit: 10 }),
    getTranslatedArticles(locale as Locale, { category: 'tutorial', limit: 6 }),
    getTranslatedArticles(locale as Locale, { category: 'news', limit: 8 }),
    getTranslatedModels(locale as Locale),
  ])

  // 按家族分组模型
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

  const basePath = locale === 'zh' ? '' : `/${locale}`
  const topThree = providers.slice(0, 3)
  const restProviders = providers.slice(3)

  const organizationSchema = locale === 'ru' ? generateRuOrganizationSchema() : generateOrganizationSchema()
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
        <Header locale={locale as Locale} dict={dict} />

        <main className="flex-1">
          {/* Hero + 模型比价入口 */}
          <section className="bg-gradient-to-b from-blue-50 to-white pt-8 pb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {dict.home.hero.title}
              </h1>
              <p className="text-sm text-gray-600 mb-5">
                {dict.home.hero.subtitle}
                <span className="mx-2 text-gray-300">·</span>
                {dict.home.hero.note_1}
                <span className="mx-2 text-gray-300">·</span>
                {dict.home.hero.note_2} {new Date().toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'ru-RU')}
              </p>

              {/* 模型详细比价 */}
              {modelGroups.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                      {dict.home.model_comparison.badge}
                    </span>
                    <h2 className="text-lg font-bold text-gray-900">{dict.home.model_comparison.title}</h2>
                    <span className="text-xs text-gray-500">
                      {dict.home.model_comparison.subtitle}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {modelGroups.map((group) => (
                      <div key={group.family} className="flex flex-wrap items-center gap-2">
                        <span className="w-16 shrink-0 text-xs font-medium text-gray-400 tracking-wider">
                          {group.label}
                        </span>
                        {group.items.map((item) => (
                          <Link
                            key={item.slug}
                            href={`/models/${item.slug}`}
                            className="px-2 py-1 text-xs border border-gray-200 rounded hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            {formatModelName(item.name)} →
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 服务商列表 - 表格样式 */}
          {providers.length > 0 && (
            <section className="py-8 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {dict.home.sections.providers}
                </h2>

                {/* 表格布局 */}
                <div className="space-y-3">
                  {providers.slice(0, 10).map((provider, index) => (
                    <div
                      key={provider.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* 左侧：服务商名称和描述 */}
                        <div className="flex-1 min-w-0 border-l-4 border-blue-500 pl-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {provider.name}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {provider.description}
                          </p>
                        </div>

                        {/* 中间：标签区域 */}
                        <div className="hidden lg:flex items-center gap-3 flex-wrap">
                          {/* 验证状态 */}
                          {provider.verification_status === 'verified' && (
                            <span className="px-3 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded">
                              ✓ {dict.providers.verified || 'Проверено'}
                            </span>
                          )}

                          {/* 价格标签 */}
                          {provider.min_topup && (
                            <span className="px-3 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 rounded">
                              {provider.min_topup}
                            </span>
                          )}

                          {/* 试用额度 */}
                          {provider.trial_credit && (
                            <span className="px-3 py-1 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded">
                              🎁 {provider.trial_credit}
                            </span>
                          )}

                          {/* 稳定性指示 */}
                          {provider.verification_status === 'verified' && (
                            <span className="px-3 py-1 text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded">
                              {dict.providers.stable || 'отлично'}
                            </span>
                          )}

                          {/* 推荐标签 */}
                          {provider.is_recommended && (
                            <span className="px-3 py-1 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded">
                              ⭐
                            </span>
                          )}
                        </div>

                        {/* 右侧：按钮区域 */}
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/${locale === 'zh' ? '' : locale + '/'}providers/${provider.slug}`}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded transition-colors"
                          >
                            {dict.common.view_details || 'Обзор'}
                          </Link>
                          <a
                            href={provider.website_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                          >
                            {dict.common.visit_website || 'Сайт'} →
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center mt-6">
                  <Link
                    href={`/${locale === 'zh' ? '' : locale + '/'}providers`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {dict.common.view_more} →
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* 为什么选择我们 */}
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">{dict.home.why_choose_us.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Link href={`${basePath}/methodology`} className="text-center group">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {dict.home.why_choose_us.verification.title}
                  </h3>
                  <p className="text-gray-600">
                    {dict.home.why_choose_us.verification.description}
                  </p>
                </Link>

                <Link href={`${basePath}/methodology`} className="text-center group">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                    {dict.home.why_choose_us.pricing.title}
                  </h3>
                  <p className="text-gray-600">
                    {dict.home.why_choose_us.pricing.description}
                  </p>
                </Link>

                <Link href={`${basePath}/articles`} className="text-center group">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                    <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    {dict.home.why_choose_us.tutorials.title}
                  </h3>
                  <p className="text-gray-600">
                    {dict.home.why_choose_us.tutorials.description}
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
                  <h2 className="text-2xl font-bold text-gray-900">{dict.home.tutorials.title}</h2>
                  <Link
                    href={`${basePath}/articles?category=tutorial`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {dict.home.tutorials.view_all}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tutorials.map((article) => (
                    <Link
                      key={article.id}
                      href={`${basePath}/articles/${article.slug}`}
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
                          {new Date(article.published_at).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'ru-RU')}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>

        <Footer locale={locale as Locale} dict={dict} />
      </div>
    </>
  )
}
