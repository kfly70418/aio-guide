import { notFound } from 'next/navigation'
import { Inter } from 'next/font/google'
import { locales, type Locale } from '@/lib/i18n/config'
import YandexMetrica from '@/components/YandexMetrica'
import '@/app/globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // 验证语言参数
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  return (
    <div className={inter.className}>
      {children}
      {locale === 'ru' && <YandexMetrica id="111802664" />}
    </div>
  )
}
