import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/utils'

const topics = [
  { key: 'choose', href: '/providers' },
  { key: 'stability', href: '/rankings/stable' },
  { key: 'authenticity', href: '/tools/api-test' },
  { key: 'cost', href: '/articles/api-credit-exchange-rate' },
  { key: 'trial', href: '/rankings/free' },
  { key: 'troubleshooting', href: '/articles/beginner-api-troubleshooting' },
] as const

export function SelectionGuide({ locale = 'zh', className = '' }: {
  locale?: Locale
  className?: string
}) {
  const copy = getDictionary(locale).home.selection_guide
  const basePath = locale === 'zh' ? '' : `/${locale}`

  return (
    <section id="selection-guide" aria-labelledby="selection-guide-title" className={`bg-gray-50 py-10 sm:py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-3xl">
          <h2 id="selection-guide-title" className="text-2xl font-bold text-gray-900 mb-2">{copy.title}</h2>
          <p className="text-gray-600 leading-relaxed">{copy.description}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic, index) => {
            const item = copy.items[topic.key]
            return (
              <Link
                key={topic.key}
                href={`${basePath}${topic.href}`}
                className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 sm:p-6 transition-colors hover:border-blue-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
              >
                <span aria-hidden="true" className="mb-4 text-sm font-semibold text-blue-600">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-700">{item.title}</h3>
                <p className="mb-5 text-sm leading-6 text-gray-600">{item.description}</p>
                <span className="mt-auto flex items-center gap-2 text-sm font-medium text-blue-700">
                  {item.action}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" />
                </span>
              </Link>
            )
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium">
          <Link href={`${basePath}/models`} className="text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600">{copy.compare}</Link>
          <Link href={`${basePath}/articles?category=tutorial`} className="text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600">{copy.tutorials}</Link>
        </div>
      </div>
    </section>
  )
}
