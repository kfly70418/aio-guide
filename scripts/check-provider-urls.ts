/**
 * 检查所有服务商网址是否有效
 *
 * 功能：
 * 1. 从数据库读取所有服务商
 * 2. 检查网址格式和可访问性
 * 3. 生成问题清单
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// 加载 .env.local 文件
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少环境变量')
  console.error('请确保 .env.local 文件包含:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL')
  console.error('  SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface ProviderCheck {
  id: string
  name: string
  slug: string
  website_url: string | null
  status: 'ok' | 'missing' | 'invalid' | 'timeout' | 'error'
  response_time?: number
  error_message?: string
  http_status?: number
}

// 检查 URL 格式
function isValidUrl(url: string | null): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// 检查网址可访问性
async function checkUrlAccessibility(url: string): Promise<{
  status: 'ok' | 'timeout' | 'error'
  response_time: number
  http_status?: number
  error_message?: string
}> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10秒超时

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; APIXuan-Bot/1.0; +https://www.apixuan.com)'
      }
    })

    clearTimeout(timeout)
    const response_time = Date.now() - startTime

    return {
      status: 'ok',
      response_time,
      http_status: response.status
    }
  } catch (error: any) {
    const response_time = Date.now() - startTime

    if (error.name === 'AbortError') {
      return {
        status: 'timeout',
        response_time,
        error_message: 'Connection timeout (>10s)'
      }
    }

    return {
      status: 'error',
      response_time,
      error_message: error.message || 'Unknown error'
    }
  }
}

// 检查所有服务商
async function checkAllProviders() {
  console.log('🔍 开始检查所有服务商网址...')
  console.log('─'.repeat(80))

  // 获取所有服务商
  const { data: providers, error } = await supabase
    .from('providers')
    .select('id, name, slug, website_url')
    .order('name')

  if (error) {
    console.error('❌ 获取服务商列表失败:', error)
    throw error
  }

  console.log(`📊 共 ${providers.length} 个服务商待检查\n`)

  const results: ProviderCheck[] = []

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i]
    console.log(`[${i + 1}/${providers.length}] 检查: ${provider.name}`)

    const result: ProviderCheck = {
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      website_url: provider.website_url,
      status: 'ok'
    }

    // 检查 1: 是否有网址
    if (!provider.website_url) {
      result.status = 'missing'
      console.log(`  ❌ 缺少网址`)
      results.push(result)
      continue
    }

    // 检查 2: URL 格式是否正确
    if (!isValidUrl(provider.website_url)) {
      result.status = 'invalid'
      result.error_message = 'URL 格式无效'
      console.log(`  ❌ URL 格式无效: ${provider.website_url}`)
      results.push(result)
      continue
    }

    // 检查 3: 网址是否可访问
    const checkResult = await checkUrlAccessibility(provider.website_url)
    result.status = checkResult.status
    result.response_time = checkResult.response_time
    result.http_status = checkResult.http_status
    result.error_message = checkResult.error_message

    if (checkResult.status === 'ok') {
      console.log(`  ✅ 正常 (${checkResult.response_time}ms, HTTP ${checkResult.http_status})`)
    } else if (checkResult.status === 'timeout') {
      console.log(`  ⏱️  超时 (${checkResult.response_time}ms)`)
    } else {
      console.log(`  ❌ 错误: ${checkResult.error_message}`)
    }

    results.push(result)

    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return results
}

// 生成报告
function generateReport(results: ProviderCheck[]) {
  const ok = results.filter(r => r.status === 'ok')
  const missing = results.filter(r => r.status === 'missing')
  const invalid = results.filter(r => r.status === 'invalid')
  const timeout = results.filter(r => r.status === 'timeout')
  const error = results.filter(r => r.status === 'error')

  console.log('\n' + '─'.repeat(80))
  console.log('📊 检查结果统计')
  console.log('─'.repeat(80))
  console.log(`✅ 正常: ${ok.length} 个`)
  console.log(`❌ 缺少网址: ${missing.length} 个`)
  console.log(`❌ URL 格式无效: ${invalid.length} 个`)
  console.log(`⏱️  超时: ${timeout.length} 个`)
  console.log(`❌ 访问错误: ${error.length} 个`)

  // 详细问题列表
  const problems = [...missing, ...invalid, ...timeout, ...error]

  if (problems.length > 0) {
    console.log('\n' + '─'.repeat(80))
    console.log('⚠️  需要处理的服务商清单')
    console.log('─'.repeat(80))

    if (missing.length > 0) {
      console.log('\n❌ 缺少网址 (需要补充):')
      missing.forEach(p => {
        console.log(`   - ${p.name} (slug: ${p.slug})`)
      })
    }

    if (invalid.length > 0) {
      console.log('\n❌ URL 格式无效 (需要修正):')
      invalid.forEach(p => {
        console.log(`   - ${p.name}`)
        console.log(`     当前: ${p.website_url}`)
        console.log(`     问题: ${p.error_message}`)
      })
    }

    if (timeout.length > 0) {
      console.log('\n⏱️  访问超时 (需要确认):')
      timeout.forEach(p => {
        console.log(`   - ${p.name}`)
        console.log(`     网址: ${p.website_url}`)
        console.log(`     问题: ${p.error_message}`)
      })
    }

    if (error.length > 0) {
      console.log('\n❌ 访问错误 (需要确认):')
      error.forEach(p => {
        console.log(`   - ${p.name}`)
        console.log(`     网址: ${p.website_url}`)
        console.log(`     错误: ${p.error_message}`)
      })
    }

    console.log('\n' + '─'.repeat(80))
    console.log('📋 修正建议')
    console.log('─'.repeat(80))
    console.log('1. 对于缺少网址的服务商，请手动搜索并补充')
    console.log('2. 对于格式无效的 URL，检查是否缺少 https:// 前缀')
    console.log('3. 对于超时/错误的网址，访问确认是否需要更换域名')
    console.log('4. 修正后的数据整理成 JSON 格式提供给我更新')
  } else {
    console.log('\n🎉 所有服务商网址都正常！可以开始批量采集数据。')
  }

  // 保存详细报告
  const fs = require('fs')
  const reportPath = './data/provider-url-check-report.json'

  fs.mkdirSync('./data', { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify({
    checked_at: new Date().toISOString(),
    total: results.length,
    summary: {
      ok: ok.length,
      missing: missing.length,
      invalid: invalid.length,
      timeout: timeout.length,
      error: error.length
    },
    details: results
  }, null, 2))

  console.log(`\n✅ 详细报告已保存: ${reportPath}`)
}

// 主函数
async function main() {
  try {
    const results = await checkAllProviders()
    generateReport(results)
  } catch (error) {
    console.error('❌ 检查失败:', error)
    process.exit(1)
  }
}

// 执行
if (require.main === module) {
  main()
}

export { checkAllProviders, generateReport }
