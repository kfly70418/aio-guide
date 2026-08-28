'use client'

import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

export interface ModelComparisonGroup {
  family: string
  label: string
  items: Array<{ slug: string; name: string }>
}

interface ModelComparisonProps {
  groups: ModelComparisonGroup[]
  basePath?: string
  badge: string
  title: string
  subtitle: string
  expandLabel?: string
}

export function ModelComparison({
  groups,
  basePath = '',
  badge,
  title,
  subtitle,
  expandLabel = '展开',
}: ModelComparisonProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((group, index) => [group.family, index === 0]))
  )

  useEffect(() => {
    if (window.matchMedia('(min-width: 640px)').matches) {
      setExpanded(Object.fromEntries(groups.map((group) => [group.family, true])))
    }
  }, [groups])

  if (groups.length === 0) return null

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5" aria-label={title}>
      <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4">
        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{badge}</span>
        <h2 className="text-base font-bold text-gray-900 sm:text-lg">{title}</h2>
        <span className="w-full text-xs leading-5 text-gray-500 sm:w-auto">{subtitle}</span>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {groups.map((group) => {
          const isExpanded = expanded[group.family] ?? false
          return (
            <div key={group.family} className="rounded-lg border border-gray-100 bg-gray-50/60 sm:border-0 sm:bg-transparent">
              <button
                type="button"
                onClick={() => setExpanded((current) => ({ ...current, [group.family]: !isExpanded }))}
                className="flex min-h-10 w-full items-center justify-between gap-2 px-2 py-2 text-left sm:hidden"
                aria-expanded={isExpanded}
              >
                <span className="text-xs font-semibold tracking-wider text-gray-500">{group.label}</span>
                <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                  {isExpanded ? '收起' : expandLabel}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                </span>
              </button>

              <div className={`${isExpanded ? 'flex' : 'hidden'} flex-wrap items-center gap-2 px-2 pb-2 sm:flex sm:px-0 sm:pb-0`}>
                <span className="hidden w-16 shrink-0 text-xs font-medium tracking-wider text-gray-400 sm:inline-block">
                  {group.label}
                </span>
                {group.items.map((item) => (
                  <Link
                    key={item.slug}
                    href={`${basePath}/models/${item.slug}`}
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 sm:px-3 sm:py-1.5 sm:text-sm"
                  >
                    <span className="break-all">{item.name}</span>
                    <span aria-hidden="true" className="shrink-0 text-gray-400">→</span>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
