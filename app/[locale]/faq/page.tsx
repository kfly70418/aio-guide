import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import { getDictionary } from '@/lib/i18n/utils'
import { locales, type Locale } from '@/lib/i18n/config'
import { generateSEOMetadata } from '@/lib/seo'
import { generateRuBreadcrumbSchema, generateRuFAQSchema } from '@/lib/seo-ru'
import { Header, Footer } from '@/components/layout/PublicLayout'
import Breadcrumb from '@/components/Breadcrumb'
import { FAQ_DATA as RU_FAQ_DATA } from '../../faq/faq-data-ru'

export const revalidate = 3600

export function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const dict = getDictionary(locale as Locale)
  const isRu = locale === 'ru'
  return generateSEOMetadata({
    title: isRu ? 'Частые вопросы об API-прокси: безопасность, цены и настройка' : 'API 中转站常见问题',
    description: isRu
      ? 'Ответы на частые вопросы об API-прокси: настройка, цены, безопасность, ошибки и выбор провайдера.'
      : 'API 中转站使用、安全、价格和故障排查常见问题。',
    path: isRu ? '/ru/faq' : '/faq',
    locale,
    siteName: dict.common.site_name,
    alternateUrls: locales.filter(l => l !== locale).map(l => ({ locale: l, url: l === 'zh' ? '/faq' : `/${l}/faq` })),
  })
}

function localizeLinks(markdown: string) {
  return markdown
    .replace(/\]\(\/((?!ru\/)[^)]+)\)/g, '](/ru/$1)')
    .replace('/ru/articles/api-429-rate-limit-error', '/ru/articles/fix-api-429-error')
    .replace('/ru/articles/api-timeout-diagnosis', '/ru/articles/fix-api-timeout')
}

export default async function RussianFAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (locale !== 'ru') notFound()

  const dict = getDictionary('ru')
  const categories = [
    { id: 'usage', name: 'Использование', icon: '📖' },
    { id: 'safety', name: 'Безопасность', icon: '🛡️' },
    { id: 'technical', name: 'Технические вопросы', icon: '🔧' },
    { id: 'pricing', name: 'Цены и оплата', icon: '💰' },
    { id: 'comparison', name: 'Выбор провайдера', icon: '⚖️' },
  ]
  const breadcrumbSchema = generateRuBreadcrumbSchema([
    { name: 'Главная', url: 'https://www.apixuan.com/ru' },
    { name: 'FAQ', url: 'https://www.apixuan.com/ru/faq' },
  ])
  const faqSchema = generateRuFAQSchema(RU_FAQ_DATA.map(faq => ({
    question: faq.question,
    answer: faq.answer.replace(/\]\([^)]*\)/g, ''),
  })))

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="min-h-screen flex flex-col bg-white">
        <Header locale="ru" dict={dict} />
        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumb items={[{ label: 'Главная', href: '/ru' }, { label: 'FAQ' }]} />
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Частые вопросы об API-прокси</h1>
              <p className="text-gray-600">Практические ответы о настройке, безопасности, ценах и выборе провайдера.</p>
            </header>
            <nav className="flex flex-wrap gap-2 mb-8" aria-label="Категории FAQ">
              {categories.map(category => (
                <a key={category.id} href={`#${category.id}`} className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:border-blue-400">
                  {category.icon} {category.name}
                </a>
              ))}
            </nav>
            {categories.map(category => {
              const entries = RU_FAQ_DATA.filter(faq => faq.category === category.id)
              if (!entries.length) return null
              return (
                <section key={category.id} id={category.id} className="mb-10">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{category.icon} {category.name}</h2>
                  <div className="space-y-5">
                    {entries.map(faq => (
                      <article key={faq.id} id={faq.id} className="border border-gray-200 rounded-lg p-5">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                        <div className="prose max-w-none text-gray-700">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{localizeLinks(faq.answer)}</ReactMarkdown>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )
            })}
            <div className="text-center mt-8">
              <Link href="/ru/providers" className="text-blue-600 hover:underline">Перейти к рейтингу API-прокси →</Link>
            </div>
          </div>
        </main>
        <Footer locale="ru" dict={dict} />
      </div>
    </>
  )
}
