import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'
import { generateSEOMetadata } from '@/lib/seo'
import { ruKeywords } from '@/lib/seo-ru'
import { Header, Footer } from '@/components/layout/PublicLayout'
import Breadcrumb from '@/components/Breadcrumb'
import { getDictionary } from '@/lib/i18n/utils'
import { locales, type Locale } from '@/lib/i18n/config'
import { getTranslatedModels } from '@/lib/i18n/translated-data'

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
      url: l === 'zh' ? '/models' : `/${l}/models`
    }))

  return generateSEOMetadata({
    title: dict.models.title,
    description: dict.models.description,
    path: `/${locale === 'zh' ? '' : locale + '/'}models`,
    locale: locale,
    alternateUrls,
    keywords: locale === 'ru' ? ruKeywords.models.keywords : undefined,
    siteName: dict.common.site_name,
  })
}

export const revalidate = 300 // ISR: 5分钟

export default async function ModelsPage({
  params,
  searchParams
}: {
  params: { locale: string }
  searchParams: { family?: string }
}) {
  const { locale } = await params
  const { family } = await searchParams

  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const dict = getDictionary(locale as Locale)
  const basePath = locale === 'zh' ? '' : `/${locale}`

  // 获取翻译后的模型数据
  const allModels = await getTranslatedModels(locale as Locale, family ? { family } : undefined)

  // 按家族分组
  const modelsByFamily = allModels.reduce((acc, model) => {
    if (!acc[model.family]) {
      acc[model.family] = []
    }
    acc[model.family].push(model)
    return acc
  }, {} as Record<string, typeof allModels>)

  const families = Object.keys(modelsByFamily).sort()

  return (
    <>
      <div className="min-h-screen flex flex-col bg-white">
        <Header locale={locale as Locale} dict={dict} />

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumb
              items={[
                { label: dict.nav.home, href: `${basePath}/` },
                { label: dict.models.title },
              ]}
            />

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {dict.models.title}
              </h1>
              <p className="text-gray-600">
                {dict.models.description}
              </p>
            </div>

            {/* 家族筛选 */}
            {families.length > 1 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`${basePath}/models`}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      !family
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {dict.common.all}
                  </Link>
                  {families.map((f) => (
                    <Link
                      key={f}
                      href={`${basePath}/models?family=${f}`}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        family === f
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {f}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 模型列表 */}
            <div className="space-y-8">
              {families.map((familyName) => (
                <div key={familyName}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {familyName} {dict.models.family}
                  </h2>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {dict.models.title}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {dict.models.description}
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {dict.models.input_price}
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {dict.models.output_price}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {modelsByFamily[familyName].map((model) => (
                            <tr key={model.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {model.name}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-600 line-clamp-2">
                                  {model.description || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900">
                                  {model.official_price_input ? `¥${model.official_price_input}` : '-'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {dict.models.per_million_tokens}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="text-sm text-gray-900">
                                  {model.official_price_output ? `¥${model.official_price_output}` : '-'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {dict.models.per_million_tokens}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {allModels.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">{dict.models.no_models}</p>
              </div>
            )}
          </div>
        </main>

        <Footer locale={locale as Locale} dict={dict} />
      </div>
    </>
  )
}
