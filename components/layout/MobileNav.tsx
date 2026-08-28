'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import type { Locale } from '@/lib/i18n/config'

interface MobileNavProps {
  locale: Locale
  dict: any
}

export function MobileNav({ locale, dict }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const basePath = locale === 'zh' ? '' : `/${locale}`

  const links = [
    { href: `${basePath}/providers`, label: dict.nav.providers },
    { href: `${basePath}/models`, label: dict.nav.models },
    { href: `${basePath}/articles`, label: dict.nav.articles },
    { href: `${basePath}/about`, label: dict.nav.about },
  ]

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 text-gray-700 transition-colors hover:border-blue-500 hover:text-blue-600"
        aria-label={isOpen ? '关闭导航菜单' : '打开导航菜单'}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
      >
        {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="关闭导航菜单"
            className="fixed inset-0 z-40 cursor-default bg-black/20"
            onClick={() => setIsOpen(false)}
          />
          <nav
            id="mobile-navigation"
            className="absolute left-0 right-0 top-full z-50 border-b border-gray-200 bg-white px-4 py-3 shadow-lg"
            aria-label="移动端导航"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-md px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-gray-100 pt-2">
                <LanguageSwitcher currentLocale={locale} className="w-full" />
              </div>
            </div>
          </nav>
        </>
      )}
    </div>
  )
}
