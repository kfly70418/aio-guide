// TypeScript 类型定义

// 数据库表类型
export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  role: 'admin' | 'super_admin'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Provider {
  id: string
  slug: string
  name: string
  name_en: string | null
  logo_url: string | null
  website_url: string | null
  description: string | null
  features: string[] | null
  is_recommended: boolean
  status: 'draft' | 'published' | 'archived'
  sort_order: number
  verified_at: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface Model {
  id: string
  slug: string
  name: string
  family: string
  provider_official: string | null
  description: string | null
  official_price_input: number | null
  official_price_output: number | null
  status: 'draft' | 'published' | 'archived'
  sort_order: number
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface Channel {
  id: string
  provider_id: string
  name: string
  description: string | null
  is_primary: boolean
  priority: number
  status: 'active' | 'inactive'
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface Price {
  id: string
  channel_id: string
  model_id: string
  price_input: number
  price_output: number
  currency: 'CNY' | 'USD'
  effective_date: string
  notes: string | null
  verified_at: string | null
  status: 'active' | 'inactive'
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface PriceHistory {
  id: string
  price_id: string
  channel_id: string
  model_id: string
  price_input_old: number | null
  price_output_old: number | null
  price_input_new: number
  price_output_new: number
  currency: 'CNY' | 'USD'
  change_type: 'created' | 'updated' | 'deleted'
  changed_by: string | null
  changed_at: string
}

export interface Article {
  id: string
  slug: string
  title: string
  summary: string | null
  content: string
  cover_image_url: string | null
  related_provider_id: string | null
  category: 'tutorial' | 'guide' | 'news' | 'faq'
  tags: string[] | null
  status: 'draft' | 'published' | 'archived'
  view_count: number
  sort_order: number
  published_at: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface ClickEvent {
  id: string
  provider_id: string
  referrer: string | null
  user_agent: string | null
  ip_address: string | null
  clicked_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string | null
  details: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// 扩展类型（包含关联数据）
export interface ProviderWithChannels extends Provider {
  channels?: Channel[]
}

export interface ChannelWithProvider extends Channel {
  provider?: Provider
}

export interface PriceWithDetails extends Price {
  channel?: Channel
  model?: Model
  provider?: Provider
}

export interface ArticleWithProvider extends Article {
  provider?: Provider
}

// 表单类型
export interface ProviderFormData {
  slug: string
  name: string
  name_en?: string
  logo_url?: string
  website_url?: string
  description?: string
  features?: string[]
  is_recommended: boolean
  status: 'draft' | 'published' | 'archived'
  sort_order: number
}

export interface ModelFormData {
  slug: string
  name: string
  family: string
  provider_official?: string
  description?: string
  official_price_input?: number
  official_price_output?: number
  status: 'draft' | 'published' | 'archived'
  sort_order: number
}

export interface ChannelFormData {
  provider_id: string
  name: string
  description?: string
  is_primary: boolean
  priority: number
  status: 'active' | 'inactive'
}

export interface PriceFormData {
  channel_id: string
  model_id: string
  price_input: number
  price_output: number
  currency: 'CNY' | 'USD'
  effective_date: string
  notes?: string
}

export interface ArticleFormData {
  slug: string
  title: string
  summary?: string
  content: string
  cover_image_url?: string
  related_provider_id?: string
  category: 'tutorial' | 'guide' | 'news' | 'faq'
  tags?: string[]
  status: 'draft' | 'published' | 'archived'
  sort_order: number
}

// API 响应类型
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 筛选和排序类型
export interface ProviderFilters {
  status?: 'draft' | 'published' | 'archived'
  is_recommended?: boolean
  search?: string
}

export interface ModelFilters {
  status?: 'draft' | 'published' | 'archived'
  family?: string
  search?: string
}

export interface ArticleFilters {
  status?: 'draft' | 'published' | 'archived'
  category?: 'tutorial' | 'guide' | 'news' | 'faq'
  search?: string
}

export interface PriceFilters {
  provider_id?: string
  model_id?: string
  status?: 'active' | 'inactive'
  expired?: boolean
}

export type SortOrder = 'asc' | 'desc'

export interface SortOptions {
  field: string
  order: SortOrder
}
