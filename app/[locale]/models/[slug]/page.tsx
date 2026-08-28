import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'
import { getTranslatedModel } from '@/lib/i18n/translated-data'
import { getDictionary } from '@/lib/i18n/utils'
import { locales, type Locale } from '@/lib/i18n/config'
import { generateSEOMetadata } from '@/lib/seo'
import { generateRuBreadcrumbSchema } from '@/lib/seo-ru'
import { Header, Footer } from '@/components/layout/PublicLayout'
import Breadcrumb from '@/components/Breadcrumb'

export const revalidate = 300

async function getModelId(slug: string) {
  const supabase = createPublicClient()
  const { data } = await supabase.from('models').select('id').eq('slug', slug).eq('status', 'published').maybeSingle()
  return data?.id || null
}

export async function generateStaticParams() {
  const supabase = createPublicClient()
  const { data } = await supabase.from('models').select('slug').eq('status', 'published')
  return locales.flatMap(locale => (data || []).map(model => ({ locale, slug: model.slug })))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params
  const id = await getModelId(slug)
  if (!id) return generateSEOMetadata({ title: 'Модель не найдена', description: 'Модель не найдена', path: `/${locale}/models/${slug}`, noindex: true })
  const model = await getTranslatedModel(id, locale as Locale)
  const dict = getDictionary(locale as Locale)
  if (!model) return generateSEOMetadata({ title: 'Модель не найдена', description: 'Перевод этой модели пока не опубликован.', path: `/${locale}/models/${slug}`, noindex: true })
  return generateSEOMetadata({
    title: `${model?.name || slug} — сравнение цен API`,
    description: model?.description || `Сравнение цен на модель ${model?.name || slug} у API-прокси.`,
    path: `/${locale === 'zh' ? '' : `${locale}/`}models/${slug}`,
    locale,
    siteName: dict.common.site_name,
    alternateUrls: locales.filter(l => l !== locale).map(l => ({ locale: l, url: l === 'zh' ? `/models/${slug}` : `/${l}/models/${slug}` })),
  })
}

export default async function LocalizedModelDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  if (!locales.includes(locale as Locale)) notFound()
  const id = await getModelId(slug)
  if (!id) notFound()
  const model = await getTranslatedModel(id, locale as Locale)
  if (!model) notFound()
  const dict = getDictionary(locale as Locale)
  const basePath = locale === 'zh' ? '' : `/${locale}`
  const supabase = createPublicClient()
  const { data: prices } = await supabase
    .from('prices')
    .select('id, price_input, price_output, currency, verified_at, channel:channels!inner(name, provider:providers!inner(slug, name, status))')
    .eq('model_id', id).eq('status', 'active')
  const rows = (prices || []).filter((price: any) => price.channel?.provider?.status === 'published')
  const breadcrumbSchema = locale === 'ru' ? generateRuBreadcrumbSchema([
    { name: 'Главная', url: 'https://www.apixuan.com/ru' },
    { name: dict.models.title, url: 'https://www.apixuan.com/ru/models' },
    { name: model.name, url: `https://www.apixuan.com/ru/models/${slug}` },
  ]) : undefined

  return (
    <>
      {breadcrumbSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />}
      <div className="min-h-screen flex flex-col bg-white">
        <Header locale={locale as Locale} dict={dict} />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumb items={[{ label: dict.nav.home, href: `${basePath}/` }, { label: dict.models.title, href: `${basePath}/models` }, { label: model.name }]} />
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{model.name} — сравнение цен API</h1>
              {model.description && <p className="text-gray-600">{model.description}</p>}
            </header>
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <h2 className="text-xl font-semibold p-5 border-b border-gray-200">Цены у API-прокси</h2>
              {rows.length ? (
                <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-3 text-left">Провайдер</th><th className="p-3 text-right">Вход</th><th className="p-3 text-right">Выход</th><th className="p-3 text-left">Проверено</th></tr></thead><tbody>{rows.map((row: any) => <tr key={row.id} className="border-t border-gray-100"><td className="p-3"><Link className="text-blue-600 hover:underline" href={`${basePath}/providers/${row.channel.provider.slug}`}>{row.channel.provider.name}</Link></td><td className="p-3 text-right">{row.price_input} {row.currency}</td><td className="p-3 text-right">{row.price_output} {row.currency}</td><td className="p-3">{row.verified_at ? new Date(row.verified_at).toLocaleDateString('ru-RU') : '—'}</td></tr>)}</tbody></table></div>
              ) : <p className="p-5 text-gray-500">Пока нет активных предложений.</p>}
            </section>
          </div>
        </main>
        <Footer locale={locale as Locale} dict={dict} />
      </div>
    </>
  )
}
