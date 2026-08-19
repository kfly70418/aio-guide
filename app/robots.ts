import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/admin/*',
          '/auth/',
          '/auth/*',
          '/api/',
          '/api/*',
          '/*?search=*',   // 搜索参数不索引
        ],
      },
      // 优先抓取高价值 SEO 页面
      {
        userAgent: 'Googlebot',
        allow: [
          '/rankings/',
          '/faq',
          '/providers/',
          '/models/',
          '/articles/',
        ],
        crawlDelay: 0,
      },
      {
        userAgent: 'Baiduspider',
        allow: [
          '/rankings/',
          '/faq',
          '/providers/',
          '/models/',
          '/articles/',
        ],
        crawlDelay: 1,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
