import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ApiTestPage } from '@/components/tools/ApiTestPage'
import { generateSEOMetadata } from '@/lib/seo'
import { locales, type Locale } from '@/lib/i18n/config'

export function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params

  if (locale !== 'ru') return {}

  return generateSEOMetadata({
    title: 'Онлайн-проверка AI API — доступность и время ответа',
    description: 'Бесплатная проверка подключения к API-прокси: HTTP-статус, задержка, модель в ответе и расход токенов. API-ключ не сохраняется.',
    path: '/ru/tools/api-test',
    locale: 'ru',
    alternateUrls: [{ locale: 'zh', url: '/tools/api-test' }],
    keywords: ['проверка API', 'тест API ключа', 'проверка API-прокси', 'OpenAI API тест'],
    siteName: 'Выбор API',
  })
}

export default async function RussianApiTestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (locale !== 'ru') notFound()
  return <ApiTestPage locale={locale as Locale} />
}
