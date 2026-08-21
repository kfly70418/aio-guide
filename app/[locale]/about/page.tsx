import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateSEOMetadata } from '@/lib/seo'
import { Header, Footer } from '@/components/layout/PublicLayout'
import Breadcrumb from '@/components/Breadcrumb'
import { getDictionary } from '@/lib/i18n/utils'
import { locales, type Locale } from '@/lib/i18n/config'

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
      url: l === 'zh' ? '/about' : `/${l}/about`
    }))

  return generateSEOMetadata({
    title: dict.about.title,
    description: dict.about.description,
    path: `/${locale === 'zh' ? '' : locale + '/'}about`,
    locale: locale,
    alternateUrls,
    siteName: dict.common.site_name,
  })
}

export default async function AboutPage({ params }: { params: { locale: string } }) {
  const { locale } = await params

  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const dict = getDictionary(locale as Locale)
  const basePath = locale === 'zh' ? '' : `/${locale}`

  return (
    <>
      <div className="min-h-screen flex flex-col bg-white">
        <Header locale={locale as Locale} dict={dict} />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumb
              items={[
                { label: dict.nav.home, href: `${basePath}/` },
                { label: dict.about.title },
              ]}
            />

            <div className="prose prose-lg max-w-none">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {dict.about.title}
              </h1>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <p className="text-lg text-gray-700 leading-relaxed">
                  {dict.about.mission}
                </p>
              </div>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {dict.about.what_we_do}
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>{dict.about.what_we_do_1}</p>
                  <p>{dict.about.what_we_do_2}</p>
                  <p>{dict.about.what_we_do_3}</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {dict.about.why_trust_us}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      ✓ {dict.about.trust_1_title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {dict.about.trust_1_desc}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      ✓ {dict.about.trust_2_title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {dict.about.trust_2_desc}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      ✓ {dict.about.trust_3_title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {dict.about.trust_3_desc}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      ✓ {dict.about.trust_4_title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {dict.about.trust_4_desc}
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {dict.about.contact_title}
                </h2>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <p className="text-gray-600 mb-4">{dict.about.contact_desc}</p>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-semibold">{dict.footer.business_email}:</span>{' '}
                      <a href="mailto:kfly70418@gmail.com" className="text-blue-600 hover:underline">
                        kfly70418@gmail.com
                      </a>
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {dict.footer.disclaimer}
                </h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <p className="text-gray-700 mb-2">
                    {dict.footer.disclaimer_text}
                  </p>
                  <p className="text-gray-700">
                    {dict.footer.disclaimer_detail}
                  </p>
                </div>
              </section>
            </div>
          </div>
        </main>

        <Footer locale={locale as Locale} dict={dict} />
      </div>
    </>
  )
}
