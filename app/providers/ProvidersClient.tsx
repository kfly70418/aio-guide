'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDownUp,
  Check,
  ChevronRight,
  CircleCheck,
  ExternalLink,
  Gift,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
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
  verified_at: string | null
  website_url: string | null
  description: string | null
  features: string[] | null
  is_recommended: boolean
  families: string[]
}

interface ProvidersClientProps {
  providers: RankingProvider[]
}

type QuickFilter = 'recommended' | 'verified' | 'lowPrice' | 'trial' | 'invoice'
type SortMode = 'ranking' | 'verified' | 'name'

const QUICK_FILTERS: Array<{
  key: QuickFilter
  label: string
  icon: typeof ShieldCheck
}> = [
  { key: 'recommended', label: '编辑推荐', icon: Sparkles },
  { key: 'verified', label: '近期核验', icon: ShieldCheck },
  { key: 'lowPrice', label: '有低价档', icon: CircleCheck },
  { key: 'trial', label: '新人赠送', icon: Gift },
  { key: 'invoice', label: '支持开票', icon: ReceiptText },
]

const FAMILY_OPTIONS = [
  { value: 'all', label: '全部模型' },
  { value: 'GPT', label: 'GPT' },
  { value: 'Claude', label: 'Claude' },
  { value: 'Gemini', label: 'Gemini' },
  { value: 'Grok', label: 'Grok' },
]

function isRecentlyVerified(value: string | null) {
  if (!value) return false
  const verifiedTime = new Date(value).getTime()
  if (Number.isNaN(verifiedTime)) return false
  return Date.now() - verifiedTime <= 30 * 24 * 60 * 60 * 1000
}

function formatVerifiedDate(value: string | null) {
  if (!value) return '待核验'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function matchesQuickFilter(provider: RankingProvider, filter: QuickFilter) {
  switch (filter) {
    case 'recommended':
      return provider.is_recommended
    case 'verified':
      return provider.verification_status === 'verified' && isRecentlyVerified(provider.verified_at)
    case 'lowPrice':
      return provider.price_level?.split(/[\s,、/]+/).includes('低') ?? false
    case 'trial':
      return Boolean(provider.trial_credit && !/^(无|暂无|-)$/.test(provider.trial_credit.trim()))
    case 'invoice':
      return provider.invoice_support
  }
}

function PriceLevels({ value }: { value: string | null }) {
  if (!value) return <span className="text-gray-400">待补充</span>

  const active = new Set(value.split(/[\s,、/]+/).filter(Boolean))
  return (
    <div className="flex flex-wrap gap-1" aria-label={`价格档位：${value}`}>
      {['低', '中', '高'].map((level) => (
        <span
          key={level}
          className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs font-medium ${
            active.has(level)
              ? level === '低'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : level === '中'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-orange-200 bg-orange-50 text-orange-700'
              : 'border-gray-100 bg-gray-50 text-gray-300'
          }`}
        >
          {level}
        </span>
      ))}
    </div>
  )
}

function VerificationBadge({ provider }: { provider: RankingProvider }) {
  const verified = provider.verification_status === 'verified' && provider.verified_at

  if (!verified) return <span className="text-xs text-gray-400">待核验</span>

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"
      title="已核验网站可访问性和基础资料，不代表持续性能测试"
    >
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      {formatVerifiedDate(provider.verified_at)}
    </span>
  )
}

export function ProvidersClient({ providers }: ProvidersClientProps) {
  const [search, setSearch] = useState('')
  const [family, setFamily] = useState('all')
  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>([])
  const [sortMode, setSortMode] = useState<SortMode>('ranking')
  const [mobileVisibleCount, setMobileVisibleCount] = useState(10)

  const filteredProviders = useMemo(() => {
    const searchLower = search.toLowerCase().trim()
    const rows = providers.filter((provider) => {
      const searchableText = [
        provider.name,
        provider.description,
        ...(provider.features ?? []),
        ...provider.families,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return (
        (!searchLower || searchableText.includes(searchLower)) &&
        (family === 'all' || provider.families.includes(family)) &&
        quickFilters.every((filter) => matchesQuickFilter(provider, filter))
      )
    })

    if (sortMode === 'verified') {
      return rows.sort(
        (a, b) => new Date(b.verified_at ?? 0).getTime() - new Date(a.verified_at ?? 0).getTime()
      )
    }
    if (sortMode === 'name') {
      return rows.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    }
    return rows
  }, [providers, search, family, quickFilters, sortMode])

  const filterCounts = useMemo(() => {
    return Object.fromEntries(
      QUICK_FILTERS.map(({ key }) => [key, providers.filter((p) => matchesQuickFilter(p, key)).length])
    ) as Record<QuickFilter, number>
  }, [providers])

  const hasActiveFilters = Boolean(search || family !== 'all' || quickFilters.length)

  function toggleQuickFilter(filter: QuickFilter) {
    setMobileVisibleCount(10)
    setQuickFilters((current) =>
      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]
    )
  }

  function resetFilters() {
    setSearch('')
    setFamily('all')
    setQuickFilters([])
    setSortMode('ranking')
    setMobileVisibleCount(10)
  }

  return (
    <>
      <section className="mb-5 border-y border-gray-200 bg-white py-4" aria-label="服务商筛选">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px]">
          <label className="relative block">
            <span className="sr-only">搜索服务商</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="搜索名称、模型或特点"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setMobileVisibleCount(10)
              }}
              className="min-h-11 w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="relative">
            <span className="sr-only">按模型筛选</span>
            <select
              value={family}
              onChange={(event) => {
                setFamily(event.target.value)
                setMobileVisibleCount(10)
              }}
              className="min-h-11 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 pr-9 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {FAMILY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="relative">
            <span className="sr-only">排序方式</span>
            <ArrowDownUp
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <select
              value={sortMode}
              onChange={(event) => {
                setSortMode(event.target.value as SortMode)
                setMobileVisibleCount(10)
              }}
              className="min-h-11 w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pl-10 pr-9 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ranking">综合推荐排序</option>
              <option value="verified">最近核验优先</option>
              <option value="name">按名称排序</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap" aria-label="快速条件">
          {QUICK_FILTERS.map(({ key, label, icon: Icon }) => {
            const active = quickFilters.includes(key)
            const disabled = filterCounts[key] === 0
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                disabled={disabled}
                onClick={() => toggleQuickFilter(key)}
                className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ${
                  active
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : disabled
                      ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-700'
                }`}
              >
                {active ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                {label}
                <span className={active ? 'text-blue-100' : 'text-gray-400'}>{filterCounts[key]}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
          <p aria-live="polite">
            显示 <strong className="font-semibold text-gray-900">{filteredProviders.length}</strong> 家服务商
            {hasActiveFilters ? `，已启用 ${quickFilters.length + (family !== 'all' ? 1 : 0) + (search ? 1 : 0)} 个条件` : ''}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex shrink-0 items-center gap-1 text-gray-600 hover:text-blue-700"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              清除筛选
            </button>
          )}
        </div>
      </section>

      {filteredProviders.length > 0 ? (
        <>
          <div className="space-y-3 lg:hidden">
            {filteredProviders.slice(0, mobileVisibleCount).map((provider) => {
              const originalRank = providers.findIndex((item) => item.id === provider.id) + 1
              return (
                <article key={provider.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-600">
                      {originalRank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/providers/${provider.slug}`}
                          className="text-base font-semibold text-gray-950 hover:text-blue-700"
                        >
                          {provider.name}
                        </Link>
                        {provider.is_recommended && (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                            推荐
                          </span>
                        )}
                      </div>
                      {provider.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-600">{provider.description}</p>
                      )}
                    </div>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-100 pt-3 text-sm">
                    <div>
                      <dt className="text-xs text-gray-500">基础核验</dt>
                      <dd className="mt-1"><VerificationBadge provider={provider} /></dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">支持模型</dt>
                      <dd className="mt-1 flex flex-wrap gap-1">
                        {provider.families.length ? provider.families.map((item) => (
                          <span key={item} className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">{item}</span>
                        )) : <span className="text-gray-400">待补充</span>}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">价格档位</dt>
                      <dd className="mt-1"><PriceLevels value={provider.price_level} /></dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">最低充值</dt>
                      <dd className="mt-1 font-medium text-gray-900">{provider.min_topup || '待补充'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">新人赠送</dt>
                      <dd className="mt-1 font-medium text-gray-900">{provider.trial_credit || '无公开信息'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">开票</dt>
                      <dd className="mt-1 font-medium text-gray-900">
                        {provider.invoice_policy || (provider.invoice_support ? '支持' : '未标注支持')}
                      </dd>
                    </div>
                  </dl>

                  {provider.features && provider.features.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {provider.features.slice(0, 3).map((feature) => (
                        <span key={feature} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/providers/${provider.slug}`}
                      className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-md border border-gray-300 px-3 text-xs font-medium text-gray-700 hover:border-blue-400 hover:text-blue-700"
                    >
                      查看详情
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                    {provider.website_url && (
                      <TrackedExternalLink
                        href={provider.website_url}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        providerSlug={provider.slug}
                        placement="providers_mobile_card"
                        className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        访问官网
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </TrackedExternalLink>
                    )}
                  </div>
                </article>
              )
            })}

            {mobileVisibleCount < filteredProviders.length && (
              <button
                type="button"
                onClick={() => setMobileVisibleCount((count) => count + 10)}
                className="min-h-11 w-full rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-700"
              >
                显示更多（还剩 {filteredProviders.length - mobileVisibleCount} 家）
              </button>
            )}
          </div>

          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white lg:block">
            <table className="w-full table-fixed text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-600">
                <tr>
                  <th className="w-[25%] px-4 py-3 text-left">服务商</th>
                  <th className="w-[14%] px-3 py-3 text-left">模型 / 特点</th>
                  <th className="w-[12%] px-3 py-3 text-left">基础核验</th>
                  <th className="w-[11%] px-3 py-3 text-left">价格 / 起充</th>
                  <th className="w-[12%] px-3 py-3 text-left">新人赠送</th>
                  <th className="w-[16%] px-3 py-3 text-left">退款 / 开票</th>
                  <th className="w-[10%] px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProviders.map((provider) => {
                  const originalRank = providers.findIndex((item) => item.id === provider.id) + 1
                  return (
                    <tr key={provider.id} className="align-top transition-colors hover:bg-blue-50/40">
                      <td className="px-4 py-4">
                        <div className="flex gap-3">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-500">
                            {originalRank}
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/providers/${provider.slug}`}
                                className="font-semibold text-gray-950 hover:text-blue-700"
                              >
                                {provider.name}
                              </Link>
                              {provider.is_recommended && (
                                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">推荐</span>
                              )}
                            </div>
                            {provider.description && (
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{provider.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-1">
                          {provider.families.length ? provider.families.map((item) => (
                            <span key={item} className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">{item}</span>
                          )) : <span className="text-xs text-gray-400">待补充</span>}
                        </div>
                        {provider.features?.[0] && (
                          <p className="mt-2 line-clamp-2 text-xs leading-4 text-gray-500">{provider.features[0]}</p>
                        )}
                      </td>
                      <td className="px-3 py-4"><VerificationBadge provider={provider} /></td>
                      <td className="px-3 py-4">
                        <PriceLevels value={provider.price_level} />
                        <p className="mt-2 text-xs text-gray-600">起充 {provider.min_topup || '待补充'}</p>
                      </td>
                      <td className="px-3 py-4 text-xs leading-5 text-gray-700">
                        {provider.trial_credit || '无公开信息'}
                      </td>
                      <td className="px-3 py-4 text-xs leading-5 text-gray-700">
                        <p>{provider.refund_policy || '退款政策待补充'}</p>
                        <p className="mt-1 text-gray-500">
                          {provider.invoice_policy || (provider.invoice_support ? '支持开票' : '未标注开票')}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-end gap-2">
                          {provider.website_url && (
                            <TrackedExternalLink
                              href={provider.website_url}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              providerSlug={provider.slug}
                              placement="providers_desktop_table"
                              className="inline-flex min-h-8 items-center gap-1 rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700"
                            >
                              官网
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </TrackedExternalLink>
                          )}
                          <Link
                            href={`/providers/${provider.slug}`}
                            className="inline-flex min-h-8 items-center gap-1 rounded-md border border-gray-300 px-3 text-xs font-medium text-gray-700 hover:border-blue-400 hover:text-blue-700"
                          >
                            详情
                            <ChevronRight className="h-3 w-3" aria-hidden="true" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="border-y border-gray-200 bg-white py-16 text-center">
          <Search className="mx-auto h-8 w-8 text-gray-300" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-gray-700">没有找到符合条件的服务商</p>
          <button type="button" onClick={resetFilters} className="mt-2 text-sm text-blue-700 hover:underline">
            清除筛选条件
          </button>
        </div>
      )}
    </>
  )
}
