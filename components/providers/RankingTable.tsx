'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

export interface RankingProvider {
  id: string
  slug: string
  name: string
  min_topup: string | null
  trial_credit: string | null
  invoice_support: boolean | null
  verification_status: string | null
  website_url: string | null
  description: string | null
  features: string[] | null
  is_recommended: boolean
  families: string[]
}

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'Claude', label: 'Claude' },
  { key: 'GPT', label: 'GPT' },
  { key: 'Gemini', label: 'Gemini' },
  { key: 'Grok', label: 'Grok' },
]

/** 「低 中 高」→ 三个独立标签，未覆盖的档次显示为浅灰 */
function PriceLevels({ value }: { value: string | null }) {
  const active = new Set((value ?? '').split(/[\s,、]+/).filter(Boolean))
  const all = ['低', '中', '高']

  if (active.size === 0) return <span className="text-gray-400">—</span>

  return (
    <div className="flex items-center gap-1">
      {all.map((lv) => {
        const on = active.has(lv)
        return (
          <span
            key={lv}
            className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded border ${
              on
                ? lv === '低'
                  ? 'bg-green-50 text-green-700 border-green-300'
                  : lv === '中'
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-orange-50 text-orange-700 border-orange-300'
                : 'bg-gray-50 text-gray-300 border-gray-200'
            }`}
            title={on ? `有${lv}价位档` : `无${lv}价位档`}
          >
            {lv}
          </span>
        )
      })}
    </div>
  )
}

function CopyCoupon({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          await navigator.clipboard.writeText(code)
          setCopied(true)
          setTimeout(() => setCopied(false), 1800)
        } catch {
          setCopied(false)
        }
      }}
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
    >
      {copied ? '已复制' : '复制优惠码'}
    </button>
  )
}

export function RankingTable({ providers }: { providers: RankingProvider[] }) {
  const [filter, setFilter] = useState('all')

  const rows = useMemo(() => {
    if (filter === 'all') return providers
    return providers.filter((p) => p.families.includes(filter))
  }, [providers, filter])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: providers.length }
    for (const f of FILTERS) {
      if (f.key === 'all') continue
      c[f.key] = providers.filter((p) => p.families.includes(f.key)).length
    }
    return c
  }, [providers])

  return (
    <>
      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm text-gray-500 mr-1">模型</span>
        {FILTERS.map((f) => {
          const n = counts[f.key] ?? 0
          const disabled = n === 0 && f.key !== 'all'
          return (
            <button
              key={f.key}
              type="button"
              disabled={disabled}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                filter === f.key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : disabled
                    ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {f.label}
              {f.key !== 'all' && n > 0 && (
                <span className={filter === f.key ? 'ml-1 text-blue-100' : 'ml-1 text-gray-400'}>
                  {n}
                </span>
              )}
            </button>
          )
        })}
        <span className="ml-auto text-xs text-gray-500">
          共 {rows.length} 家 · 数据人工核验，以官网实际计费为准
        </span>
      </div>

      {/* 表格 */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        {/* 表头 */}
        <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500">
          <div className="col-span-3">服务商</div>
          <div className="col-span-2">模型真假检测</div>
          <div className="col-span-1">价格水平</div>
          <div className="col-span-1">起充</div>
          <div className="col-span-2">赠送额度</div>
          <div className="col-span-2">退款政策 / 开票</div>
          <div className="col-span-1 text-right">操作</div>
        </div>

        {rows.length === 0 ? (
          <p className="py-16 text-center text-gray-500">该筛选条件下暂无中转站</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {rows.map((p) => (
              <li
                key={p.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-blue-50/40 transition-colors"
              >
                {/* 服务商 */}
                <div className="lg:col-span-3 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/providers/${p.slug}`}
                      className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {p.name}
                    </Link>
                    {p.is_recommended && (
                      <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                        推荐
                      </span>
                    )}
                  </div>

                  {p.description && (
                    <p className="mt-1 text-xs text-gray-600 line-clamp-1">{p.description}</p>
                  )}
                </div>

                {/* 模型真假检测 */}
                <div className="lg:col-span-2">
                  <span className="lg:hidden text-xs text-gray-500 mr-2">检测</span>
                  {p.verification_status === 'verified' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-300 rounded">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      通过检测
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>

                  {/* 价格水平列移除，改显示验证状态 */}
                  <div className="lg:col-span-1">
                    <span className="lg:hidden text-xs text-gray-500 mr-2">验证</span>
                    {p.verification_status === 'verified' ? (
                      <span className="text-xs text-green-600">✓ 已验证</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>

                {/* 起充 */}
                <div className="lg:col-span-1">
                  <span className="lg:hidden text-xs text-gray-500 mr-2">起充</span>
                  {p.min_topup ? (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
                      {p.min_topup}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>

                {/* 赠送额度 */}
                <div className="lg:col-span-2 min-w-0">
                  <span className="lg:hidden text-xs text-gray-500 mr-2">赠送</span>
                  {p.trial_credit ? (
                    <span
                      className="inline-block px-2 py-1 text-xs font-medium bg-pink-50 text-pink-700 rounded border border-pink-200 truncate max-w-full"
                      title={p.trial_credit}
                    >
                      🎁 {p.trial_credit}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>

                {/* 退款 / 开票 */}
                <div className="lg:col-span-2 text-xs text-gray-700 min-w-0">
                  <p className="truncate">
                    <span className="text-gray-500">开票 </span>
                    {p.invoice_support ? (
                      <span className="text-green-700">支持</span>
                    ) : (
                      <span className="text-gray-400">不支持</span>
                    )}
                  </p>
                </div>

                {/* 操作 */}
                <div className="lg:col-span-1 flex lg:flex-col gap-2 lg:items-end">
                  {p.website_url && (
                    <a
                      href={p.website_url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      官网
                      <span aria-hidden="true">→</span>
                    </a>
                  )}
                  <Link
                    href={`/providers/${p.slug}`}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors whitespace-nowrap"
                  >
                    查看详情
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
