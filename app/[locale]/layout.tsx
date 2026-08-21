import { notFound } from 'next/navigation'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { locales, type Locale, localeFullNames } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/utils'
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

  const dict = getDictionary(locale as Locale)

  return (
    <html lang={localeFullNames[locale as Locale]} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        {children}
        <Analytics />
        {locale === 'ru' && <YandexMetrica id="111802664" />}
      </body>
    </html>
  )
}
