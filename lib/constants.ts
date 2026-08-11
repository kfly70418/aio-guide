// 常量定义

// 网站信息
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'api中转站精选导航'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
export const SITE_DESCRIPTION = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'AI中转站评测，真实体验'

// 分页
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// 数据过期天数
export const DATA_EXPIRY_DAYS = 30

// 服务商状态
export const PROVIDER_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

// 模型状态
export const MODEL_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

// 文章状态
export const ARTICLE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

// 文章分类
export const ARTICLE_CATEGORIES = {
  TUTORIAL: 'tutorial',
  GUIDE: 'guide',
  NEWS: 'news',
  FAQ: 'faq',
} as const

// 渠道状态
export const CHANNEL_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

// 价格状态
export const PRICE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

// 货币
export const CURRENCY = {
  CNY: 'CNY',
  USD: 'USD',
} as const

// 操作类型
export const ACTION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  PUBLISH: 'publish',
  UNPUBLISH: 'unpublish',
  ARCHIVE: 'archive',
} as const

// 资源类型
export const RESOURCE_TYPES = {
  PROVIDER: 'provider',
  MODEL: 'model',
  CHANNEL: 'channel',
  PRICE: 'price',
  ARTICLE: 'article',
} as const
