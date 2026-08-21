import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from './lib/i18n/config'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查路径是否已包含语言前缀
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) {
    return NextResponse.next()
  }

  // 排除不需要国际化的路径
  const excludedPaths = [
    '/api/',
    '/admin/',
    '/auth/',
    '/_next/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/logo',
    '/images/',
  ]

  if (excludedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 检测用户语言偏好
  const locale = getLocaleFromRequest(request)

  // 如果是默认语言（中文），不添加前缀
  if (locale === defaultLocale) {
    return NextResponse.next()
  }

  // 重定向到带语言前缀的路径
  request.nextUrl.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

function getLocaleFromRequest(request: NextRequest): string {
  // 1. 检查 Cookie 中的语言偏好
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && locales.includes(cookieLocale as any)) {
    return cookieLocale
  }

  // 2. 检查 Accept-Language 头
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    // 解析 Accept-Language 头
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code, q = 'q=1'] = lang.trim().split(';')
        const quality = parseFloat(q.replace('q=', ''))
        return { code: code.split('-')[0], quality }
      })
      .sort((a, b) => b.quality - a.quality)

    // 查找支持的语言
    for (const { code } of languages) {
      if (locales.includes(code as any)) {
        return code
      }
    }
  }

  // 3. 返回默认语言
  return defaultLocale
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了以下开头的：
     * - api (API 路由)
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (favicon)
     * - public 文件夹中的文件
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|admin|auth).*)',
  ],
}
