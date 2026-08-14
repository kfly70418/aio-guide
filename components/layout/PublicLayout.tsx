import Link from 'next/link'
import Image from 'next/image'
import { SITE_NAME } from '@/lib/constants'

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            aria-label={`${SITE_NAME}首页`}
            className="flex shrink-0 items-center transition-opacity hover:opacity-80"
          >
            <Image
              src="/logo-mark.svg"
              alt="API选"
              width={36}
              height={36}
              preload
              className="h-9 w-9 sm:hidden"
            />
            <Image
              src="/logo.svg"
              alt="API选"
              width={204}
              height={56}
              preload
              className="hidden h-10 w-auto sm:block"
            />
          </Link>
          <nav className="flex gap-2 whitespace-nowrap text-xs font-medium sm:gap-6 sm:text-sm">
            <Link href="/providers" className="text-gray-700 hover:text-blue-600 transition-colors">
              中转站排行
            </Link>
            <Link href="/models" className="text-gray-700 hover:text-blue-600 transition-colors">
              模型价格
            </Link>
            <Link href="/articles" className="text-gray-700 hover:text-blue-600 transition-colors">
              使用教程
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
              关于
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">关于我们</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/about" className="hover:text-blue-600">
                  关于本站
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="hover:text-blue-600">
                  评测方法
                </Link>
              </li>
              <li>
                <Link href="/disclosure" className="hover:text-blue-600">
                  商业合作披露
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">快速导航</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/providers" className="hover:text-blue-600">
                  中转站排行
                </Link>
              </li>
              <li>
                <Link href="/models" className="hover:text-blue-600">
                  模型价格对比
                </Link>
              </li>
              <li>
                <Link href="/articles" className="hover:text-blue-600">
                  使用教程
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">声明</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              本站数据由人工录入并标注核验时间，不做实时监控或自动抓取。
              价格信息仅供参考，请以服务商官网为准。
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
