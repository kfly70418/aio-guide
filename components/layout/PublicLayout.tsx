import Link from 'next/link'
import Image from 'next/image'
import { SITE_NAME } from '@/lib/constants'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { getDictionary } from '@/lib/i18n/utils'
import type { Locale } from '@/lib/i18n/config'

interface HeaderProps {
  locale?: Locale
  dict?: any
}

export function Header({ locale = 'zh', dict }: HeaderProps = {}) {
  // 如果没有传入 dict，使用默认中文字典
  const dictionary = dict || getDictionary('zh')
  const basePath = locale === 'zh' ? '' : `/${locale}`
  const logoSrc = locale === 'ru' ? '/logo-ru.svg' : '/logo.svg'

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href={`${basePath}/`}
            aria-label={`${dictionary.common.site_name}首页`}
            className="flex shrink-0 items-center transition-opacity hover:opacity-80"
          >
            <Image
              src="/logo-mark.svg"
              alt={dictionary.common.site_name}
              width={36}
              height={36}
              className="h-9 w-9 sm:hidden"
            />
            <Image
              src={logoSrc}
              alt={dictionary.common.site_name}
              width={204}
              height={56}
              className="hidden h-10 w-auto sm:block"
            />
          </Link>
          <nav className="flex gap-2 whitespace-nowrap text-xs font-medium sm:gap-4 sm:text-sm items-center">
            <Link href={`${basePath}/providers`} className="text-gray-700 hover:text-blue-600 transition-colors">
              {dictionary.nav.providers}
            </Link>
            <Link href={`${basePath}/models`} className="text-gray-700 hover:text-blue-600 transition-colors">
              {dictionary.nav.models}
            </Link>
            <Link href={`${basePath}/articles`} className="text-gray-700 hover:text-blue-600 transition-colors">
              {dictionary.nav.articles}
            </Link>
            <Link href={`${basePath}/about`} className="text-gray-700 hover:text-blue-600 transition-colors">
              {dictionary.nav.about}
            </Link>
            <LanguageSwitcher currentLocale={locale} />
          </nav>
        </div>
      </div>
    </header>
  )
}

interface FooterProps {
  locale?: Locale
  dict?: any
}

export function Footer({ locale = 'zh', dict }: FooterProps = {}) {
  // 如果没有传入 dict，使用默认中文字典
  const dictionary = dict || getDictionary('zh')
  const basePath = locale === 'zh' ? '' : `/${locale}`

  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{dictionary.nav.about}</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href={`${basePath}/about`} className="hover:text-blue-600">
                  {dictionary.nav.about}
                </Link>
              </li>
              <li>
                <Link href={`${basePath}/methodology`} className="hover:text-blue-600">
                  {dictionary.nav.methodology}
                </Link>
              </li>
              <li>
                <Link href={`${basePath}/disclosure`} className="hover:text-blue-600">
                  {dictionary.nav.disclosure}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{dictionary.footer.quick_links}</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href={`${basePath}/providers`} className="hover:text-blue-600">
                  {dictionary.nav.providers}
                </Link>
              </li>
              <li>
                <Link href={`${basePath}/models`} className="hover:text-blue-600">
                  {dictionary.nav.models}
                </Link>
              </li>
              <li>
                <Link href={`${basePath}/articles`} className="hover:text-blue-600">
                  {dictionary.nav.articles}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{dictionary.footer.disclaimer}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {dictionary.footer.disclaimer_text}
              {dictionary.footer.disclaimer_detail}
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} {dictionary.common.site_name}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
