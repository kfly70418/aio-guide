// 国际化配置
export const locales = ['zh', 'ru'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'zh'

// 语言显示名称
export const localeNames: Record<Locale, string> = {
  zh: '中文',
  ru: 'Русский',
}

// 语言的本地化名称（用于 HTML lang 属性）
export const localeFullNames: Record<Locale, string> = {
  zh: 'zh-CN',
  ru: 'ru-RU',
}

// 货币配置
export const localeCurrency: Record<Locale, string> = {
  zh: 'CNY',
  ru: 'RUB',
}

// 汇率（CNY 为基准）
export const exchangeRates: Record<string, number> = {
  CNY: 1,
  RUB: 13.5, // 1 CNY ≈ 13.5 RUB (2026年8月参考汇率)
  USD: 0.14,
}

// 日期格式
export const localeDateFormat: Record<Locale, string> = {
  zh: 'YYYY年MM月DD日',
  ru: 'DD.MM.YYYY',
}

// 时区
export const localeTimezone: Record<Locale, string> = {
  zh: 'Asia/Shanghai',
  ru: 'Europe/Moscow',
}
