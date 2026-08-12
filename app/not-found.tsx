import Link from 'next/link'
import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/constants'
import { Header, Footer } from '@/components/layout/PublicLayout'

export const metadata: Metadata = {
  title: `页面不存在 - ${SITE_NAME}`,
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

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

          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-2xl font-semibold text-gray-900 mb-4">页面不存在</p>
          <p className="text-gray-600 mb-8">
            您访问的页面可能已被删除、链接输入有误，或者内容尚未发布。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              回到首页
            </Link>
            <Link
              href="/providers"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              浏览中转站
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
