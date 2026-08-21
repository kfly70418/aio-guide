/**
 * 语言切换器组件
 */
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { localeNames, locales, type Locale } from '@/lib/i18n/config'
import { useState } from 'react'
import { getDictionary } from '@/lib/i18n/utils'

interface LanguageSwitcherProps {
  currentLocale: Locale
  className?: string
}

export function LanguageSwitcher({ currentLocale, className = '' }: LanguageSwitcherProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dict = getDictionary(currentLocale)

  // 获取其他语言选项（排除当前语言）
  const otherLocales = locales.filter(locale => locale !== currentLocale)

  const switchLocale = (newLocale: Locale) => {
    // 构建新的路径
    let newPathname = pathname

    // 移除当前语言前缀
    if (pathname.startsWith(`/${currentLocale}`)) {
      newPathname = pathname.slice(currentLocale.length + 1) || '/'
    }

    // 添加新语言前缀（默认语言不需要前缀）
    if (newLocale !== 'zh') {
      newPathname = `/${newLocale}${newPathname}`
    }

    // 设置 Cookie 保存语言偏好
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`

    setIsOpen(false)

    // 导航到新路径
    router.push(newPathname)
  }

  // 语言代码显示（大写）
  const localeCode = currentLocale === 'zh' ? 'ZH' : 'RU'

  return (
    <div className={`relative ${className}`}>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-blue-600 transition-colors border border-gray-300 rounded-md bg-white"
        aria-label={dict.common.switch_language}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M2 12h20" />
        </svg>
        <span className="font-medium">{localeCode}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* 菜单内容 */}
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            {/* 其他语言选项 */}
            {otherLocales.map((locale) => (
              <button
                key={locale}
                onClick={() => switchLocale(locale)}
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>{localeNames[locale]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
