/**
 * 数据库翻译工具
 * 用于获取和管理数据库中的多语言内容
 */

import { createPublicClient } from '../supabase/public'
import type { Locale } from './config'

interface Translation {
  field: string
  value: string
}

/**
 * 获取资源的翻译
 */
export async function getTranslations(
  resourceType: string,
  resourceId: string,
  locale: Locale
): Promise<Record<string, string>> {
  // 中文是默认语言，不需要查询翻译表
  if (locale === 'zh') {
    return {}
  }

  const supabase = createPublicClient()

  const { data, error } = await supabase
    .from('translations')
    .select('field, value')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .eq('locale', locale)

  if (error) {
    console.error('获取翻译失败:', error)
    return {}
  }

  // 转换为对象格式
  const translations: Record<string, string> = {}
  data?.forEach((t: Translation) => {
    translations[t.field] = t.value
  })

  return translations
}

/**
 * 批量获取多个资源的翻译
 */
export async function getBatchTranslations(
  resourceType: string,
  resourceIds: string[],
  locale: Locale
): Promise<Map<string, Record<string, string>>> {
  if (locale === 'zh' || resourceIds.length === 0) {
    return new Map()
  }

  const supabase = createPublicClient()

  const { data, error } = await supabase
    .from('translations')
    .select('resource_id, field, value')
    .eq('resource_type', resourceType)
    .in('resource_id', resourceIds)
    .eq('locale', locale)

  if (error) {
    console.error('批量获取翻译失败:', error)
    return new Map()
  }

  // 按 resource_id 分组
  const translationsMap = new Map<string, Record<string, string>>()

  data?.forEach((t: Translation & { resource_id: string }) => {
    if (!translationsMap.has(t.resource_id)) {
      translationsMap.set(t.resource_id, {})
    }
    translationsMap.get(t.resource_id)![t.field] = t.value
  })

  return translationsMap
}

/**
 * 应用翻译到对象
 */
export function applyTranslations<T extends Record<string, any>>(
  obj: T,
  translations: Record<string, string>
): T {
  const result = { ...obj } as any

  for (const field in translations) {
    if (field in result) {
      result[field] = translations[field]
    }
  }

  return result as T
}

/**
 * 批量应用翻译
 */
export function applyBatchTranslations<T extends { id: string }>(
  items: T[],
  translationsMap: Map<string, Record<string, string>>
): T[] {
  return items.map(item => {
    const translations = translationsMap.get(item.id)
    if (translations) {
      return applyTranslations(item, translations)
    }
    return item
  })
}

/**
 * 保存翻译（用于管理后台或批量导入）
 */
export async function saveTranslation(
  resourceType: string,
  resourceId: string,
  locale: Locale,
  field: string,
  value: string
) {
  const supabase = createPublicClient()

  const { error } = await supabase.from('translations').upsert(
    {
      resource_type: resourceType,
      resource_id: resourceId,
      locale,
      field,
      value,
    },
    {
      onConflict: 'resource_type,resource_id,locale,field',
    }
  )

  if (error) {
    console.error('保存翻译失败:', error)
    throw error
  }
}

/**
 * 批量保存翻译
 */
export async function saveBatchTranslations(
  translations: Array<{
    resourceType: string
    resourceId: string
    locale: Locale
    field: string
    value: string
  }>
) {
  const supabase = createPublicClient()

  const records = translations.map(t => ({
    resource_type: t.resourceType,
    resource_id: t.resourceId,
    locale: t.locale,
    field: t.field,
    value: t.value,
  }))

  const { error } = await supabase.from('translations').upsert(records, {
    onConflict: 'resource_type,resource_id,locale,field',
  })

  if (error) {
    console.error('批量保存翻译失败:', error)
    throw error
  }
}
