import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'
import { generateSEOMetadata } from '@/lib/seo'
import { generateRuServiceSchema, generateRuBreadcrumbSchema } from '@/lib/seo-ru'
import { Header, Footer } from '@/components/layout/PublicLayout'
import { Badge } from '@/components/ui'
import Breadcrumb from '@/components/Breadcrumb'
import { TrackedExternalLink } from '@/components/analytics/TrackedExternalLink'
import { getDictionary } from '@/lib/i18n/utils'
import { locales, type Locale } from '@/lib/i18n/config'
import { getTranslatedProvider } from '@/lib/i18n/translated-data'

// 扩展 provider 类型以包含可能存在的字段
type ExtendedProvider = Awaited<ReturnType<typeof getTranslatedProvider>> & {
  payment_methods?: string[]
  supported_models?: string[]
  notes?: string
}

export const revalidate = 300

export async function generateMetadata({
  params
}: {
  params: { locale: string; slug: string }
}): Promise<Metadata> {
  const { locale, slug } = await params

  // 通过 slug 获取服务商 ID
  const supabase = createPublicClient()
  const { data: providerData } = await supabase
    .from('providers')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!providerData) {
    return {}
  }

  const provider = await getTranslatedProvider(providerData.id, locale as Locale)

  if (!provider) {
    return {}
  }

  const dict = getDictionary(locale as Locale)

  // 生成多语言链接
  const alternateUrls = locales
    .filter(l => l !== locale)
    .map(l => ({
      locale: l,
      url: l === 'zh' ? `/providers/${slug}` : `/${l}/providers/${slug}`
    }))

  return generateSEOMetadata({
    title: `${provider.name} - ${dict.providers.title}`,
    description: provider.description || '',
    path: `/${locale === 'zh' ? '' : locale + '/'}providers/${slug}`,
    locale: locale,
    alternateUrls,
    siteName: dict.common.site_name,
  })
}

export default async function ProviderDetailPage({
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

  // 通过 slug 获取服务商 ID
  const supabase = createPublicClient()
  const { data: providerData } = await supabase
    .from('providers')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!providerData) {
    notFound()
  }

  const provider = await getTranslatedProvider(providerData.id, locale as Locale) as ExtendedProvider

  if (!provider) {
    notFound()
  }

  const providerUrl = `${basePath}/providers/${slug}`
  const providerFeatures = Array.isArray(provider.features) ? provider.features : []
  const serviceSchema = locale === 'ru' ? generateRuServiceSchema({
    name: provider.name,
    description: provider.description || '',
    url: `https://www.apixuan.com${providerUrl}`,
    features: providerFeatures,
  }) : undefined
  const breadcrumbSchema = locale === 'ru' ? generateRuBreadcrumbSchema([
    { name: dict.nav.home, url: 'https://www.apixuan.com/ru' },
    { name: dict.providers.title, url: 'https://www.apixuan.com/ru/providers' },
    { name: provider.name, url: `https://www.apixuan.com${providerUrl}` },
  ]) : undefined

  return (
    <>
      {serviceSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />}
      {breadcrumbSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />}
      <div className="min-h-screen flex flex-col bg-white">
        <Header locale={locale as Locale} dict={dict} />

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumb
              items={[
                { label: dict.nav.home, href: `${basePath}/` },
                { label: dict.providers.title, href: `${basePath}/providers` },
                { label: provider.name },
              ]}
            />

            {/* 服务商标题 */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {provider.name}
                  </h1>
                  <div className="flex items-center gap-2">
                    {provider.is_recommended && (
                      <Badge variant="primary" size="sm">
                        {dict.providers.recommended}
                      </Badge>
                    )}
                    {provider.verified_at && (
                      <Badge variant="success" size="sm">
                        {dict.providers.verified}
                      </Badge>
                    )}
                  </div>
                </div>
                {provider.website_url && (
                  <TrackedExternalLink
                    href={provider.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    providerSlug={provider.slug}
                    placement="provider_detail_locale"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {dict.providers.visit_website} →
                  </TrackedExternalLink>
                )}
              </div>
              <p className="text-lg text-gray-600">{provider.description}</p>
            </div>

            {/* 关键信息卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {provider.min_topup && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">{dict.providers.min_topup}</div>
                  <div className="text-2xl font-bold text-gray-900">{provider.min_topup}</div>
                </div>
              )}
              {provider.trial_credit && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">{dict.providers.trial_credit}</div>
                  <div className="text-2xl font-bold text-green-600">{provider.trial_credit}</div>
                </div>
              )}
              {provider.transaction_fee !== null && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">{dict.providers.transaction_fee}</div>
                  <div className="text-2xl font-bold text-gray-900">{provider.transaction_fee}</div>
                </div>
              )}
              {provider.verified_at && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">{dict.providers.verified_at}</div>
                  <div className="text-lg font-bold text-gray-900">
                    {new Date(provider.verified_at).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'ru-RU')}
                  </div>
                </div>
              )}
            </div>

            {/* 特性和功能 */}
            {(() => {
              // 安全处理 features 字段，可能是数组或 JSON 字符串
              let featuresArray: string[] = []
              if (provider.features) {
                if (Array.isArray(provider.features)) {
                  featuresArray = provider.features
                } else if (typeof provider.features === 'string') {
                  try {
                    const parsed = JSON.parse(provider.features)
                    featuresArray = Array.isArray(parsed) ? parsed : []
                  } catch {
                    featuresArray = []
                  }
                }
              }

              return featuresArray.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{dict.providers.features}</h2>
                  <div className="flex flex-wrap gap-3">
                    {featuresArray.map((feature: string, index: number) => (
                      <span
                        key={`${feature}-${index}`}
                        className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        ✓ {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null
            })()}

            {/* 支付方式 */}
            {provider.payment_methods && Array.isArray(provider.payment_methods) && provider.payment_methods.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{dict.providers.payment_methods}</h2>
                <div className="flex flex-wrap gap-3">
                  {provider.payment_methods.map((method: string) => (
                    <span
                      key={method}
                      className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-800"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 支持的模型 */}
            {provider.supported_models && Array.isArray(provider.supported_models) && provider.supported_models.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{dict.providers.supported_models}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {provider.supported_models.map((model: string) => (
                    <div
                      key={model}
                      className="px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 text-center"
                    >
                      {model}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 注意事项 */}
            {provider.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{dict.providers.notes}</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{provider.notes}</p>
              </div>
            )}

            {/* 返回列表 */}
            <div className="text-center">
              <Link
                href={`${basePath}/providers`}
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
