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
import { getTranslatedProviders } from '@/lib/i18n/translated-data'

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
      url: l === 'zh' ? '/providers' : `/${l}/providers`
    }))

  return generateSEOMetadata({
    title: dict.providers.title,
    description: dict.providers.description,
    path: `/${locale === 'zh' ? '' : locale + '/'}providers`,
    locale: locale,
    alternateUrls,
    keywords: locale === 'ru' ? ruKeywords.providers.keywords : undefined,
    siteName: dict.common.site_name,
  })
}

export const revalidate = 300 // ISR: 5分钟

export default async function ProvidersPage({ params }: { params: { locale: string } }) {
  const { locale } = await params

  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const dict = getDictionary(locale as Locale)
  const basePath = locale === 'zh' ? '' : `/${locale}`

  // 获取翻译后的服务商数据
  const providers = await getTranslatedProviders(locale as Locale)

  return (
    <>
      <div className="min-h-screen flex flex-col bg-white">
        <Header locale={locale as Locale} dict={dict} />

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumb
              items={[
                { label: dict.nav.home, href: `${basePath}/` },
                { label: dict.providers.title },
              ]}
            />

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {dict.providers.title}
              </h1>
              <p className="text-gray-600">
                {dict.providers.description}
              </p>
            </div>

            {/* 服务商列表 */}
            <div className="space-y-4">
              {providers.map((provider, index) => (
                <Link
                  key={provider.id}
                  href={`${basePath}/providers/${provider.slug}`}
                  className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                          {provider.name}
                        </h2>
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
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {provider.description}
                      </p>

                      {/* 关键信息 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {provider.min_topup && (
                          <div>
                            <span className="text-gray-500">{dict.providers.min_topup}: </span>
                            <span className="font-medium text-gray-900">{provider.min_topup}</span>
                          </div>
                        )}
                        {provider.trial_credit && (
                          <div>
                            <span className="text-gray-500">{dict.providers.trial_credit}: </span>
                            <span className="font-medium text-green-600">{provider.trial_credit}</span>
                          </div>
                        )}
                        {provider.transaction_fee !== null && (
                          <div>
                            <span className="text-gray-500">{dict.providers.transaction_fee}: </span>
                            <span className="font-medium text-gray-900">{provider.transaction_fee}</span>
                          </div>
                        )}
                        {provider.invoice_support && (
                          <div>
                            <span className="text-gray-500">{dict.providers.invoice_support}: </span>
                            <span className="font-medium text-blue-600">{dict.features.invoice}</span>
                          </div>
                        )}
                      </div>

                      {/* 特性标签 */}
                      {provider.features && Array.isArray(provider.features) && provider.features.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {provider.features.map((feature: string) => (
                            <span
                              key={feature}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                      {provider.features && typeof provider.features === 'string' && (
                        <div className="text-sm text-gray-600 mt-4">
                          {provider.features}
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col items-end">
                      <div className="text-2xl font-bold text-gray-900">#{index + 1}</div>
                      {provider.verified_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          {dict.providers.verified_at}
                          <br />
                          {new Date(provider.verified_at).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'ru-RU')}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {providers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">{dict.providers.no_providers}</p>
              </div>
            )}
          </div>
        </main>

        <Footer locale={locale as Locale} dict={dict} />
      </div>
    </>
  )
}
