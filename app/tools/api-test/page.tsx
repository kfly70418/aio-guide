import type { Metadata } from 'next'
import { ApiTestPage } from '@/components/tools/ApiTestPage'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'AI API 在线检测 - 测试中转站连通性与响应速度',
  description: '免费检测 AI API 中转站是否可以连接，查看 HTTP 状态、响应时间、返回模型和 Token 用量。API Key 仅用于本次请求，不会保存。',
  path: '/tools/api-test',
  locale: 'zh',
  alternateUrls: [{ locale: 'ru', url: '/ru/tools/api-test' }],
  keywords: ['API 在线检测', '中转站检测', 'API 连通性测试', 'API Key 测试', 'OpenAI API 测试'],
})

export default function ChineseApiTestPage() {
  return <ApiTestPage locale="zh" />
}
