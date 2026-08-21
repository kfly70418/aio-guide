import Link from 'next/link'
import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/constants'
import { Header, Footer } from '@/components/layout/PublicLayout'
import { getDictionary } from '@/lib/i18n/utils'
import type { Locale } from '@/lib/i18n/config'

export const metadata: Metadata = {
  title: `页面不存在 - ${SITE_NAME}`,
  robots: { index: false, follow: false },
}

export default function NotFound() {
  // 尝试从 URL 获取语言，默认为中文
  const locale: Locale = 'zh'
  const dict = getDictionary(locale)
  const basePath = locale === 'zh' ? '' : `/${locale}`

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header locale={locale} dict={dict} />

      <main className="flex-1 flex items-center justify-center py-16">
        <div className="text-center max-w-md px-4">
          <div className="mb-8">
            <svg
              className="mx-auto h-24 w-24 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <p className="text-2xl font-semibold text-gray-900 mb-4">{dict.not_found.title}</p>
          <p className="text-gray-600 mb-8">
            {dict.not_found.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`${basePath}/`}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {dict.not_found.back_home}
            </Link>
            <Link
              href={`${basePath}/providers`}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {dict.not_found.browse_providers}
            </Link>
          </div>
        </div>
      </main>

      <Footer locale={locale} dict={dict} />
    </div>
  )
}
