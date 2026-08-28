'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui'

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

  const filteredProviders = useMemo(() => {
    if (!search.trim()) return providers

    const searchLower = search.toLowerCase().trim()
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.features?.some((f) => f.toLowerCase().includes(searchLower))
    )
  }, [providers, search])

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
        {search && (
          <p className="text-sm text-gray-500 mt-2">
            找到 {filteredProviders.length} 个结果
          </p>
        )}
      </div>

      {/* 服务商列表 */}
      {filteredProviders.length > 0 ? (
        <div className="overflow-x-auto">
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
      ) : (
        <div className="text-center py-8 text-gray-500">
          未找到匹配的服务商
        </div>
      )}
    </>
  )
}
