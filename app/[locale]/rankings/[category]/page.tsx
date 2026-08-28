import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'
import { getBatchTranslations, applyBatchTranslations } from '@/lib/i18n/translations'
import { getDictionary } from '@/lib/i18n/utils'
import { locales, type Locale } from '@/lib/i18n/config'
import { generateSEOMetadata, generateItemListSchema } from '@/lib/seo'
import { generateRuBreadcrumbSchema } from '@/lib/seo-ru'
import { Header, Footer } from '@/components/layout/PublicLayout'
import Breadcrumb from '@/components/Breadcrumb'
import { RANKING_CATEGORIES } from '../../../rankings/[category]/page'
import { sortProvidersByLocale } from '@/lib/provider-order'

export const revalidate = 300

const TITLES: Record<string, { title: string; description: string }> = {
  'claude-api': { title: 'Лучшие API-прокси Claude', description: 'Сравнение проверенных API-прокси для Claude по доступности моделей, цене и стабильности.' },
  'gpt-api': { title: 'Лучшие API-прокси GPT', description: 'Рейтинг API-прокси с моделями GPT, прозрачными тарифами и ручной проверкой данных.' },
  cheap: { title: 'Дешёвые API-прокси', description: 'Сравнение недорогих API-прокси с низким порогом пополнения и выгодными тарифами.' },
  stable: { title: 'Стабильные API-прокси', description: 'Проверенные API-прокси с хорошей доступностью и актуальными данными.' },
  domestic: { title: 'API-прокси с прямым подключением', description: 'Сервисы с прямым подключением и удобными способами оплаты для пользователей из Китая.' },
  free: { title: 'API-прокси с бесплатным бонусом', description: 'Провайдеры, которые дают бонус или бесплатный кредит после регистрации.' },
  newbie: { title: 'API-прокси с бонусом для новичков', description: 'Сервисы с бонусами и скидками для новых пользователей.' },
  enterprise: { title: 'Корпоративные API-прокси', description: 'API-прокси с поддержкой счетов, корпоративной оплатой и функциями для команд.' },
  fast: { title: 'Быстрые API-прокси', description: 'Сервисы с быстрым откликом и оптимизированными маршрутами подключения.' },
  multimodel: { title: 'API-прокси с несколькими моделями', description: 'Провайдеры, объединяющие несколько популярных моделей ИИ в одном API.' },
}

export function generateStaticParams() {
  return locales.flatMap(locale => Object.keys(RANKING_CATEGORIES).map(category => ({ locale, category })))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; category: string }> }): Promise<Metadata> {
  const { locale, category } = await params
  const copy = TITLES[category]
  if (!copy || locale !== 'ru') return { title: 'Страница не найдена', robots: { index: false, follow: true } }
  return generateSEOMetadata({
    title: `${copy.title} — рейтинг 2026`,
    description: copy.description,
    path: `/ru/rankings/${category}`,
    locale: 'ru',
    siteName: 'Выбор API',
    alternateUrls: [{ locale: 'zh', url: `/rankings/${category}` }],
  })
}

export default async function RussianRankingPage({ params }: { params: Promise<{ locale: string; category: string }> }) {
  const { locale, category } = await params
  if (locale !== 'ru' || !RANKING_CATEGORIES[category]) notFound()
  const copy = TITLES[category]
  const config = RANKING_CATEGORIES[category]
  const supabase = createPublicClient()
  const { data } = await supabase.from('providers').select('*, channels!inner(id,status,prices!inner(model_id,models!inner(slug)))').eq('status', 'published').eq('channels.status', 'active').eq('channels.prices.status', 'active')
  const rows = data || []
  const unique = new Map<string, any>()
  for (const row of rows as any[]) {
    const channels = row.channels || []
    const modelMatch = !config.filter?.models || channels.some((channel: any) => (channel.prices || []).some((price: any) => config.filter?.models?.includes(price.models?.slug)))
    const features = Array.isArray(row.features) ? row.features : []
    const tagMatch = !config.filter?.tags || config.filter.tags.some(tag => features.includes(tag))
    if (modelMatch && tagMatch && (!config.filter?.verified || row.verified_at)) unique.set(row.id, row)
  }
  let providers = Array.from(unique.values())
  const translations = await getBatchTranslations('provider', providers.map(p => p.id), 'ru')
  providers = applyBatchTranslations(providers.filter(p => translations.get(p.id)?.description?.trim()), translations)
  providers = sortProvidersByLocale(providers, 'ru')
  const dict = getDictionary('ru')
  const items = providers.map(p => ({ name: p.name, url: `/ru/providers/${p.slug}`, description: p.description || '' }))
  const itemListSchema = generateItemListSchema({ name: copy.title, description: copy.description, url: `/ru/rankings/${category}`, items })
  const breadcrumbSchema = generateRuBreadcrumbSchema([
    { name: 'Главная', url: 'https://www.apixuan.com/ru' },
    { name: 'Рейтинг', url: 'https://www.apixuan.com/ru/rankings/claude-api' },
    { name: copy.title, url: `https://www.apixuan.com/ru/rankings/${category}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="min-h-screen flex flex-col bg-white">
        <Header locale="ru" dict={dict} />
        <main className="flex-1"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb items={[{ label: 'Главная', href: '/ru' }, { label: 'Рейтинг', href: '/ru/providers' }, { label: copy.title }]} />
          <header className="mb-8"><h1 className="text-3xl font-bold text-gray-900 mb-3">{copy.title}</h1><p className="text-gray-600">{copy.description}</p></header>
          <div className="space-y-4">
            {providers.map((provider, index) => <article key={provider.id} className="border border-gray-200 rounded-lg p-5"><div className="flex items-start gap-4"><div className="w-10 h-10 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">{index + 1}</div><div className="flex-1"><h2 className="text-xl font-semibold text-gray-900 mb-2">{provider.name}</h2><p className="text-gray-600 mb-3">{provider.description}</p><Link href={`/ru/providers/${provider.slug}`} className="text-blue-600 hover:underline">Подробнее →</Link></div></div></article>)}
          </div>
          {!providers.length && <p className="py-10 text-center text-gray-500">Пока нет подходящих провайдеров.</p>}
        </div></main>
        <Footer locale="ru" dict={dict} />
      </div>
    </>
  )
}
