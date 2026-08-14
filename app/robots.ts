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
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
