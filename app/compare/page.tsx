import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { generateSEOMetadata } from '@/lib/seo'
import Breadcrumb from '@/components/Breadcrumb'
import { TrackedExternalLink } from '@/components/analytics/TrackedExternalLink'

interface ComparePageProps {
  searchParams: Promise<{
    ids?: string
  }>
}

export async function generateMetadata({ searchParams }: ComparePageProps): Promise<Metadata> {
  const params = await searchParams
  const ids = params.ids?.split(',') || []

  if (ids.length === 0) {
    return generateSEOMetadata({
      title: 'API 中转站对比工具 - 多维度横向对比服务商',
      description: '专业的 API 中转站对比工具，支持价格、稳定性、支持模型等多维度对比。帮你快速选择最合适的 AI API 服务商。',
      path: '/compare',
    })
  }

  return generateSEOMetadata({
    title: `${ids.length} 个服务商对比 - API 中转站横向对比`,
    description: '详细对比多个 API 中转站的价格、稳定性、支持模型、支付方式等关键指标。',
    path: `/compare?ids=${params.ids}`,
  })
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // 获取 URL 参数中的服务商 IDs
  const providerIds = params.ids?.split(',').filter(Boolean) || []

  // 获取所有服务商列表（用于选择器）
  const { data: allProviders } = await supabase
    .from('providers')
    .select('id, name, slug')
    .order('name')

  // 如果有选中的服务商，获取详细信息
  let selectedProviders: any[] = []
  if (providerIds.length > 0) {
    const { data } = await supabase
      .from('providers')
      .select(`
        *,
        provider_models (
          id,
          model_name,
          input_price,
          output_price,
          pricing_unit
        )
      `)
      .in('id', providerIds)

    selectedProviders = data || []
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '服务商对比', href: '/compare' },
            ]}
          />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            🔍 API 中转站对比工具
          </h1>
          <p className="text-gray-600 mt-2">
            选择 2-4 个服务商进行多维度横向对比，帮你找到最合适的 AI API 服务商
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 服务商选择器 */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            选择要对比的服务商
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allProviders?.map((provider) => {
              const isSelected = providerIds.includes(provider.id)
              const newIds = isSelected
                ? providerIds.filter((id) => id !== provider.id)
                : [...providerIds, provider.id].slice(0, 4) // 最多 4 个

              return (
                <Link
                  key={provider.id}
                  href={`/compare?ids=${newIds.join(',')}`}
                  className={`
                    p-4 rounded-lg border-2 text-center font-medium transition-all
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }
                  `}
                >
                  {isSelected && <span className="mr-1">✓</span>}
                  {provider.name}
                </Link>
              )
            })}
          </div>

          {providerIds.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                已选择 {providerIds.length} 个服务商
                {providerIds.length < 2 && ' (至少选择 2 个)'}
              </p>
              <Link
                href="/compare"
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                清空选择
              </Link>
            </div>
          )}
        </div>

        {/* 对比结果 */}
        {selectedProviders.length >= 2 ? (
          <div className="space-y-6">
            {/* 基本信息对比 */}
            <ComparisonTable
              title="📋 基本信息"
              providers={selectedProviders}
              rows={[
                {
                  label: '服务商名称',
                  getValue: (p) => p.name,
                },
                {
                  label: '官网地址',
                  getValue: (p) => (
                    <TrackedExternalLink
                      href={p.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      providerSlug={p.slug}
                      placement="compare"
                      className="text-blue-600 hover:underline"
                    >
                      访问官网 →
                    </TrackedExternalLink>
                  ),
                },
                {
                  label: '核验时间',
                  getValue: (p) =>
                    p.last_verified_at
                      ? new Date(p.last_verified_at).toLocaleDateString('zh-CN')
                      : '未核验',
                },
                {
                  label: '推广合作',
                  getValue: (p) =>
                    p.has_affiliate ? (
                      <span className="text-orange-600">是</span>
                    ) : (
                      <span className="text-gray-500">否</span>
                    ),
                },
              ]}
            />

            {/* 价格对比 */}
            <ComparisonTable
              title="💰 价格对比 (GPT-4o)"
              providers={selectedProviders}
              rows={[
                {
                  label: '输入价格',
                  getValue: (p: any) => {
                    const gpt4o = p.provider_models?.find(
                      (m: any) => m.model_name === 'gpt-4o'
                    )
                    return gpt4o
                      ? `¥${gpt4o.input_price} / ${gpt4o.pricing_unit}`
                      : '未提供'
                  },
                },
                {
                  label: '输出价格',
                  getValue: (p: any) => {
                    const gpt4o = p.provider_models?.find(
                      (m: any) => m.model_name === 'gpt-4o'
                    )
                    return gpt4o
                      ? `¥${gpt4o.output_price} / ${gpt4o.pricing_unit}`
                      : '未提供'
                  },
                },
              ]}
            />

            {/* 支持模型对比 */}
            <ComparisonTable
              title="🤖 支持模型"
              providers={selectedProviders}
              rows={[
                {
                  label: '模型数量',
                  getValue: (p) => `${p.provider_models?.length || 0} 个`,
                },
                {
                  label: '主要模型',
                  getValue: (p: any) => {
                    const models = p.provider_models?.slice(0, 5) || []
                    return (
                      <div className="flex flex-wrap gap-1">
                        {models.map((m: any) => (
                          <span
                            key={m.id}
                            className="px-2 py-1 bg-gray-100 text-xs rounded"
                          >
                            {m.model_name}
                          </span>
                        ))}
                        {(p.provider_models?.length || 0) > 5 && (
                          <span className="text-xs text-gray-500">
                            +{(p.provider_models?.length || 0) - 5} 个
                          </span>
                        )}
                      </div>
                    )
                  },
                },
              ]}
            />

            {/* 详情链接 */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                📖 查看详细信息
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedProviders.map((provider) => (
                  <Link
                    key={provider.id}
                    href={`/providers/${provider.slug}`}
                    className="p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-center"
                  >
                    <div className="font-medium text-gray-900 mb-2">
                      {provider.name}
                    </div>
                    <span className="text-sm text-blue-600">
                      查看完整信息 →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : providerIds.length === 1 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <p className="text-yellow-800 text-lg">
              ⚠️ 请至少选择 2 个服务商进行对比
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-12 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              👆 请从上方选择服务商开始对比
            </h3>
            <p className="text-gray-600 mb-6">
              支持同时对比 2-4 个服务商的价格、模型、特性等
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl mb-2">💰</div>
                <h4 className="font-bold text-gray-900 mb-1">价格对比</h4>
                <p className="text-sm text-gray-600">
                  对比各服务商的模型定价
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl mb-2">🤖</div>
                <h4 className="font-bold text-gray-900 mb-1">模型支持</h4>
                <p className="text-sm text-gray-600">
                  查看支持的 AI 模型列表
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-bold text-gray-900 mb-1">多维度对比</h4>
                <p className="text-sm text-gray-600">
                  稳定性、特性、核验时间等
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 快速对比链接 */}
        <div className="mt-12 bg-gray-100 rounded-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            🔥 热门对比组合
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <QuickCompareLink
              title="Claude 三强对比"
              description="LinkAI vs OpenOx vs 聚星AI"
              href="/compare?ids=xxx,yyy,zzz"
            />
            <QuickCompareLink
              title="低价服务商对比"
              description="价格最优的 3 家"
              href="/rankings/cheap"
            />
            <QuickCompareLink
              title="稳定性对比"
              description="高稳定性服务商"
              href="/rankings/stable"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// 对比表格组件
function ComparisonTable({
  title,
  providers,
  rows,
}: {
  title: string
  providers: any[]
  rows: Array<{
    label: string
    getValue: (provider: any) => React.ReactNode
  }>
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-48">
                对比项
              </th>
              {providers.map((provider) => (
                <th
                  key={provider.id}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                >
                  {provider.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-700">
                  {row.label}
                </td>
                {providers.map((provider) => (
                  <td key={provider.id} className="px-6 py-4 text-sm text-gray-900">
                    {row.getValue(provider)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// 快速对比链接组件
function QuickCompareLink({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="p-4 bg-white rounded-lg border hover:border-blue-500 hover:shadow-md transition-all"
    >
      <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  )
}
