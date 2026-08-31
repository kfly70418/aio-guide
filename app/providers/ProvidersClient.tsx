'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui'
import { TrackedExternalLink } from '@/components/analytics/TrackedExternalLink'

export interface RankingProvider {
  id: string
  slug: string
  name: string
  price_level: string | null
  min_topup: string | null
  trial_credit: string | null
  refund_policy: string | null
  invoice_policy: string | null
  invoice_support: boolean
  verification_status: string | null
  website_url: string | null
  description: string | null
  features: string[] | null
  is_recommended: boolean
  families: string[]
}

interface ProvidersClientProps {
  providers: RankingProvider[]
}

export function ProvidersClient({ providers }: ProvidersClientProps) {
  const [search, setSearch] = useState('')
  const [family, setFamily] = useState('all')
  const [recommendedOnly, setRecommendedOnly] = useState(false)
  const [mobileVisibleCount, setMobileVisibleCount] = useState(10)

  const filteredProviders = useMemo(() => {
    const searchLower = search.toLowerCase().trim()
    return providers.filter(
      (p) =>
        (!searchLower ||
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.features?.some((f) => f.toLowerCase().includes(searchLower))) &&
        (family === 'all' || p.families.includes(family)) &&
        (!recommendedOnly || p.is_recommended)
    )
  }, [providers, search, family, recommendedOnly])

  useEffect(() => {
    setMobileVisibleCount(10)
  }, [search, family, recommendedOnly])

  return (
    <>
      {/* 搜索框 */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="搜索服务商名称、描述或功能..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="provider-family" className="sr-only">按模型筛选</label>
          <select
            id="provider-family"
            value={family}
            onChange={(e) => setFamily(e.target.value)}
            className="min-h-10 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:flex-none"
          >
            <option value="all">全部模型</option>
            <option value="GPT">支持 GPT</option>
            <option value="Claude">支持 Claude</option>
            <option value="Gemini">支持 Gemini</option>
            <option value="Grok">支持 Grok</option>
          </select>
          <button
            type="button"
            aria-pressed={recommendedOnly}
            onClick={() => setRecommendedOnly((value) => !value)}
            className={`min-h-10 rounded-lg border px-3 text-sm transition-colors ${
              recommendedOnly
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            仅看推荐
          </button>
          <Link
            href="/models"
            className="min-h-10 inline-flex flex-1 items-center justify-center rounded-lg border border-gray-200 px-3 text-sm text-gray-600 hover:border-blue-300 hover:text-blue-600 sm:flex-none"
          >
            按模型查价格
          </Link>
        </div>
        {search && (
          <p className="text-sm text-gray-500 mt-2">
            找到 {filteredProviders.length} 个结果
          </p>
        )}
      </div>

      {/* 服务商列表 */}
      {filteredProviders.length > 0 ? (
        <>
          {/* 移动端卡片：避免用户横向拖动宽表格 */}
          <div className="space-y-3 lg:hidden">
            {filteredProviders.slice(0, mobileVisibleCount).map((provider, index) => (
              <article
                key={provider.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/providers/${provider.slug}`}
                        className="text-base font-semibold text-blue-600 hover:text-blue-700"
                      >
                        {provider.name}
                      </Link>
                      {provider.is_recommended && <Badge variant="success" size="sm">推荐</Badge>}
                      {provider.verification_status === 'verified' && (
                        <span className="text-xs text-green-600" title="已核验">✓ 已核验</span>
                      )}
                    </div>
                    {provider.description && (
                      <p className="mt-2 text-xs leading-5 text-gray-600 line-clamp-2">
                        {provider.description}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs font-medium text-gray-400">#{index + 1}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">支持模型</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {provider.families.length > 0 ? provider.families.map((family) => (
                        <span key={family} className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
                          {family}
                        </span>
                      )) : <span className="text-gray-400">-</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">价格水平</div>
                    <div className="mt-1 font-medium text-gray-900">{provider.price_level || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">最低充值</div>
                    <div className="mt-1 font-medium text-gray-900">{provider.min_topup || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">新人赠送</div>
                    <div className="mt-1 font-medium text-gray-900">{provider.trial_credit || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">退款政策</div>
                    <div className="mt-1 truncate font-medium text-gray-900">{provider.refund_policy || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">开票政策</div>
                    <div className="mt-1 font-medium text-gray-900">{provider.invoice_support ? '支持' : '不支持'}</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {provider.website_url && (
                    <TrackedExternalLink
                      href={provider.website_url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      providerSlug={provider.slug}
                      placement="providers_mobile_card"
                      className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-medium text-white hover:bg-blue-700"
                    >
                      访问官网
                    </TrackedExternalLink>
                  )}
                  <Link
                    href={`/providers/${provider.slug}`}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600"
                  >
                    查看详情
                  </Link>
                </div>
              </article>
            ))}
            {mobileVisibleCount < filteredProviders.length && (
              <button
                type="button"
                onClick={() => setMobileVisibleCount((count) => count + 10)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600"
              >
                显示更多服务商（还剩 {filteredProviders.length - mobileVisibleCount} 家）
              </button>
            )}
          </div>

          {/* 桌面端表格 */}
          <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-[760px] divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  服务商
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  支持模型
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  价格水平
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最低充值
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  新人赠送
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  退款政策
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  开票政策
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProviders.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/providers/${provider.slug}`}
                        className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {provider.name}
                      </Link>
                      {provider.is_recommended && (
                        <Badge variant="success" size="sm">
                          推荐
                        </Badge>
                      )}
                      {provider.verification_status === 'verified' && (
                        <span className="text-xs text-green-600" title="已核验">
                          ✓
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {provider.families.map((family) => (
                        <span
                          key={family}
                          className="inline-block px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded"
                        >
                          {family}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {provider.price_level || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {provider.min_topup || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {provider.trial_credit || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {provider.refund_policy || '-'}
                  </td>
                  <td className="px-4 py-3">
                    {provider.invoice_support ? (
                      <span className="text-green-600">支持</span>
                    ) : (
                      <span className="text-gray-400">不支持</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          未找到匹配的服务商
        </div>
      )}
    </>
  )
}
