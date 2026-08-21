/**
 * 货币符号本地化工具
 */

import type { Locale } from './config'

/**
 * 货币符号映射
 */
const CURRENCY_MAP: Record<string, Record<Locale, string>> = {
  '¥': {
    zh: '¥',
    ru: '¥', // 保持人民币符号，因为文章讨论的是中国服务
  },
  'CNY': {
    zh: '元',
    ru: 'юаней',
  }
}

/**
 * 在文本中本地化货币符号和单位
 * 注意：由于文章中的价格都是人民币，我们保持 ¥ 符号不变
 * 但可以在后面添加说明文字
 */
export function localizeCurrency(content: string, locale: Locale): string {
  if (locale === 'zh') {
    return content
  }

  // 对于非中文版本，可以在表格或价格后添加货币说明
  // 暂时保持原样，因为 ¥ 是国际通用的人民币符号

  return content
}

/**
 * 格式化价格显示
 */
export function formatPrice(amount: number, locale: Locale): string {
  if (locale === 'zh') {
    return `¥${amount}`
  }

  // 对于其他语言，显示 ¥ 符号加 CNY 说明
  return `¥${amount}`
}
