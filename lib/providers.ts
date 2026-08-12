// 服务商数据访问层
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAction } from '@/lib/auditLog'
import type { Provider, ProviderFormData, ProviderFilters, SortOptions } from '@/lib/types'

/**
 * 获取服务商列表（带筛选和排序）
 */
export async function getProviders(
  filters?: ProviderFilters,
  sort?: SortOptions,
  page: number = 1,
  pageSize: number = 20
) {
  const supabase = await createClient()

  let query = supabase
    .from('providers')
    .select('*', { count: 'exact' })

  // 应用筛选
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.is_recommended !== undefined) {
    query = query.eq('is_recommended', filters.is_recommended)
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,name_en.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`)
  }

  // 应用排序
  if (sort) {
    query = query.order(sort.field, { ascending: sort.order === 'asc' })
  } else {
    query = query.order('sort_order', { ascending: false }).order('created_at', { ascending: false })
  }

  // 分页
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

/**
 * 根据 ID 获取服务商
 */
export async function getProviderById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * 根据 slug 获取服务商
 */
export async function getProviderBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * 创建服务商
 */
export async function createProvider(formData: ProviderFormData, userId: string) {
  const adminClient = createAdminClient()

  // 检查 slug 是否已存在
  const existing = await getProviderBySlug(formData.slug)
  if (existing) {
    throw new Error('该 slug 已被使用')
  }

  const { data, error } = await adminClient
    .from('providers')
    .insert({
      ...formData,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single()

  if (error) throw error

  // 记录审计日志
  await logAction({
    action: 'create',
    resourceType: 'provider',
    resourceId: data.id,
    details: { name: formData.name, slug: formData.slug },
  })

  return data
}

/**
 * 更新服务商
 */
export async function updateProvider(id: string, formData: Partial<ProviderFormData>, userId: string) {
  const adminClient = createAdminClient()

  // 如果更新 slug，检查是否与其他记录冲突
  if (formData.slug) {
    const existing = await getProviderBySlug(formData.slug)
    if (existing && existing.id !== id) {
      throw new Error('该 slug 已被使用')
    }
  }

  const { data, error } = await adminClient
    .from('providers')
    .update({
      ...formData,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // 记录审计日志
  await logAction({
    action: 'update',
    resourceType: 'provider',
    resourceId: id,
    details: formData,
  })

  return data
}

/**
 * 删除服务商
 */
export async function deleteProvider(id: string, userId: string) {
  const adminClient = createAdminClient()

  // 获取服务商信息用于日志
  const provider = await getProviderById(id)

  // 检查是否有关联的渠道
  const { count } = await adminClient
    .from('channels')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', id)

  if (count && count > 0) {
    throw new Error(`无法删除：该服务商下有 ${count} 个渠道，请先删除渠道`)
  }

  const { error } = await adminClient
    .from('providers')
    .delete()
    .eq('id', id)

  if (error) throw error

  // 记录审计日志
  await logAction({
    action: 'delete',
    resourceType: 'provider',
    resourceId: id,
    details: { name: provider.name, slug: provider.slug },
  })
}

/**
 * 标记服务商已核验
 */
export async function verifyProvider(id: string, userId: string) {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('providers')
    .update({
      verified_at: new Date().toISOString(),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // 记录审计日志
  await logAction({
    action: 'verify',
    resourceType: 'provider',
    resourceId: id,
  })

  return data
}

/**
 * 获取过期的服务商（超过 30 天未核验）
 */
export async function getExpiredProviders() {
  const supabase = await createClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('status', 'published')
    .or(`verified_at.is.null,verified_at.lt.${thirtyDaysAgo.toISOString()}`)
    .order('verified_at', { ascending: true, nullsFirst: true })

  if (error) throw error
  return data || []
}

/**
 * 发布服务商（从草稿变为已发布）
 */
export async function publishProvider(id: string, userId: string) {
  return updateProvider(id, { status: 'published' }, userId)
}

/**
 * 下架服务商（从已发布变为已归档）
 */
export async function archiveProvider(id: string, userId: string) {
  return updateProvider(id, { status: 'archived' }, userId)
}
