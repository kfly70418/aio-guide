import type { Locale } from './i18n/config'

// 首页和服务商列表使用语言独立的编辑优先级，避免中文站和俄语站共用 sort_order。
const LOCALE_PRIORITY: Record<Locale, string[]> = {
  zh: ['uu-api', 'h-api', 'openox', 'moacode', 'ailink'],
  ru: ['aitunnel', 'bothub'],
}

export function sortProvidersByLocale<T extends {
  slug: string
  is_recommended?: boolean | null
  sort_order?: number | null
}>(providers: T[], locale: Locale): T[] {
  const priority = new Map(LOCALE_PRIORITY[locale].map((slug, index) => [slug, index]))
  return [...providers].sort((a, b) => {
    const aPriority = priority.get(a.slug)
    const bPriority = priority.get(b.slug)
    if (aPriority !== undefined || bPriority !== undefined) {
      if (aPriority === undefined) return 1
      if (bPriority === undefined) return -1
      if (aPriority !== bPriority) return aPriority - bPriority
    }
    const aRecommended = a.is_recommended ? 1 : 0
    const bRecommended = b.is_recommended ? 1 : 0
    if (aRecommended !== bRecommended) return bRecommended - aRecommended
    return (b.sort_order || 0) - (a.sort_order || 0)
  })
}
