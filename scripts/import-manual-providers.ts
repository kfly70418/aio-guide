/**
 * 导入手工核验的服务商数据
 *
 * 用法：
 *   npx tsx scripts/import-manual-providers.ts                # 预览模式
 *   npx tsx scripts/import-manual-providers.ts --apply        # 执行导入
 *
 * 数据源：
 *   - data/apiranking_verified.json
 *   - data/helpaio_top10.json
 *
 * 匹配策略：按名称匹配（忽略空格、大小写），重复则更新，否则新增
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// 加载环境变量
function loadEnv(): Record<string, string> {
  const p = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(p)) return {}
  const env: Record<string, string> = {}
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return env
}

const APPLY = process.argv.includes('--apply')

// 初始化 Supabase
let supabase: any = null
if (APPLY) {
  const env = loadEnv()
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ .env.local 缺少 Supabase 配置')
    process.exit(1)
  }
  supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}

// 规范化名称用于匹配
function normalizeName(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase()
}

// 从 URL 提取域名
function extractDomain(url: string): string | null {
  if (!url) return null
  try {
    // 处理 apiranking.com/go/ 跳转链接
    if (url.includes('apiranking.com/go/')) {
      const slug = url.match(/\/go\/([^?]+)/)?.[1]
      if (slug) {
        // 将 slug 转换为可能的域名
        return slug.replace(/-/g, '')
      }
    }
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// 生成 slug
function slugify(name: string, domain: string | null): string {
  const base = (domain ? domain.split('.')[0] : name)
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || `provider-${Math.random().toString(36).slice(2, 7)}`
}

// 主函数
async function main() {
  // 读取数据文件
  const apirankingFile = path.join(process.cwd(), 'data', 'apiranking_verified.json')
  const helpaioFile = path.join(process.cwd(), 'data', 'helpaio_top10.json')

  if (!fs.existsSync(apirankingFile) || !fs.existsSync(helpaioFile)) {
    console.error('❌ 数据文件不存在')
    process.exit(1)
  }

  const apirankingData = JSON.parse(fs.readFileSync(apirankingFile, 'utf8'))
  const helpaioData = JSON.parse(fs.readFileSync(helpaioFile, 'utf8'))

  console.log(`📁 数据源：`)
  console.log(`   apiranking: ${apirankingData.count} 家 (${apirankingData.scraped_at})`)
  console.log(`   helpaio: ${helpaioData.count} 家 (${helpaioData.scraped_at})\n`)

  // 合并数据
  const providers = new Map<string, any>()

  // 处理 apiranking 数据
  for (const item of apirankingData.data) {
    const normalizedName = normalizeName(item.name)
    providers.set(normalizedName, {
      name: item.name,
      url: item.url,
      description: item.description || null,
      verified: item.verified,
      source: 'apiranking',
    })
  }

  // 处理 helpaio 数据（如果已存在则补充信息）
  for (const item of helpaioData.data) {
    const normalizedName = normalizeName(item.name)
    if (providers.has(normalizedName)) {
      // 补充评分信息
      const existing = providers.get(normalizedName)!
      existing.rating = item.rating
      existing.helpaio_rank = item.rank
    } else {
      providers.set(normalizedName, {
        name: item.name,
        url: item.url || null,
        description: null,
        verified: true,
        rating: item.rating,
        helpaio_rank: item.rank,
        source: 'helpaio',
      })
    }
  }

  console.log(`📊 合并后共 ${providers.size} 个唯一服务商\n`)

  if (!APPLY) {
    console.log('--- 预览数据 ---')
    let i = 1
    for (const [normalizedName, data] of providers) {
      console.log(`${i}. ${data.name}`)
      if (data.url) console.log(`   URL: ${data.url}`)
      if (data.description) console.log(`   描述: ${data.description}`)
      if (data.rating) console.log(`   评分: ${data.rating}`)
      console.log(`   来源: ${data.source}`)
      console.log('')
      i++
    }
    console.log('\n💡 预览模式，未写库。加 --apply 执行导入。')
    return
  }

  // 读取现有服务商
  console.log('📥 读取现有服务商...')
  const { data: existing, error } = await supabase
    .from('providers')
    .select('id, slug, name, website_url, domain, status, description')

  if (error) throw error

  const existingByName = new Map<string, any>()
  for (const row of existing ?? []) {
    const normalized = normalizeName(row.name)
    existingByName.set(normalized, row)
  }

  console.log(`   现有 ${existing?.length || 0} 家\n`)

  // 分类：更新 vs 新增
  const toUpdate: Array<{ existing: any; new: any }> = []
  const toInsert: any[] = []

  for (const [normalizedName, data] of providers) {
    const existingRow = existingByName.get(normalizedName)
    if (existingRow) {
      toUpdate.push({ existing: existingRow, new: data })
    } else {
      toInsert.push(data)
    }
  }

  console.log(`🔄 将更新 ${toUpdate.length} 家`)
  console.log(`➕ 将新增 ${toInsert.length} 家\n`)

  // 执行更新
  let updated = 0
  if (toUpdate.length > 0) {
    console.log('--- 更新现有服务商 ---')
    for (const { existing, new: newData } of toUpdate) {
      const domain = extractDomain(newData.url)
      const patch: any = {
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // 更新域名（如果有）
      if (domain && !existing.domain) {
        patch.domain = domain
      }

      // 更新网站 URL（如果有且不同）
      if (newData.url && !newData.url.includes('apiranking.com')) {
        const cleanUrl = domain ? `https://${domain}` : null
        if (cleanUrl && cleanUrl !== existing.website_url) {
          patch.website_url = cleanUrl
        }
      }

      // 补充描述（仅当现有描述为空或太短时）
      if (newData.description && (!existing.description || existing.description.length < 50)) {
        const cleanDesc = newData.description
          .replace(/💬/g, '')
          .replace(/🎁/g, '')
          .trim()
        if (cleanDesc) {
          patch.description = `${existing.name}是一家经人工核验的 AI API 中转站。${cleanDesc}`
        }
      }

      const { error: updateError } = await supabase
        .from('providers')
        .update(patch)
        .eq('id', existing.id)

      if (updateError) {
        console.log(`  ❌ ${existing.name} — ${updateError.message}`)
      } else {
        updated++
        console.log(`  ✅ ${existing.name} (${existing.slug})`)
      }
    }
  }

  // 执行新增
  let inserted = 0
  if (toInsert.length > 0) {
    console.log('\n--- 新增服务商 ---')
    for (const data of toInsert) {
      const domain = extractDomain(data.url)
      const slug = slugify(data.name, domain)
      const websiteUrl = domain ? `https://${domain}` : null

      const cleanDesc = data.description
        ? data.description.replace(/💬/g, '').replace(/🎁/g, '').trim()
        : ''

      const description = cleanDesc
        ? `${data.name}是一家经人工核验的 AI API 中转站。${cleanDesc}`
        : `${data.name}是一家经人工核验的 AI API 中转站，提供优质的模型服务。`

      const row = {
        slug,
        name: data.name,
        domain,
        website_url: websiteUrl,
        description,
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
        status: 'published', // 手工核验的直接发布
        is_recommended: false,
        invoice_support: false, // 默认值，后续人工补充
        sort_order: 100,
      }

      const { error: insertError } = await supabase
        .from('providers')
        .insert(row)

      if (insertError) {
        console.log(`  ❌ ${data.name} — ${insertError.message}`)
      } else {
        inserted++
        console.log(`  ➕ ${data.name} (${slug})`)
      }
    }
  }

  console.log(`\n✅ 完成：更新 ${updated} 家，新增 ${inserted} 家`)
  console.log('\n💡 提示：新增的服务商已标记为已发布(published)和已核验(verified)')
}

main().catch((e) => {
  console.error('❌ 失败：', e.message)
  process.exit(1)
})
