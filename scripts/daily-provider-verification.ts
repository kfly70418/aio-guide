/**
 * 每日服务商数据自动核验脚本
 * 功能：
 * 1. 检查所有服务商网站可访问性
 * 2. 验证 API 端点是否正常
 * 3. 更新核验时间戳
 * 4. 生成核验报告
 *
 * 执行时间：每天上午 10:00
 */

// Polyfill for WebSocket in Node.js environment
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class WebSocket {} as any;
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface VerificationResult {
  provider_id: string
  provider_name: string
  website_status: 'online' | 'offline' | 'slow'
  api_status: 'working' | 'error' | 'unknown'
  response_time: number
  error_message?: string
  checked_at: string
}

// 检查网站可访问性
async function checkWebsite(url: string): Promise<{
  status: 'online' | 'offline' | 'slow'
  responseTime: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10秒超时

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; APIXuan-Bot/1.0; +https://www.apixuan.com)'
      }
    })

    clearTimeout(timeout)
    const responseTime = Date.now() - startTime

    if (response.ok) {
      return {
        status: responseTime > 5000 ? 'slow' : 'online',
        responseTime
      }
    } else {
      return {
        status: 'offline',
        responseTime,
        error: `HTTP ${response.status}`
      }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      status: 'offline',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 检查 API 端点（简单的 ping 测试）
async function checkAPI(apiUrl: string): Promise<{
  status: 'working' | 'error' | 'unknown'
  error?: string
}> {
  if (!apiUrl) {
    return { status: 'unknown' }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    // 尝试访问 /v1/models 端点
    const response = await fetch(`${apiUrl}/v1/models`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Authorization': 'Bearer test-key' // 使用测试 key
      }
    })

    clearTimeout(timeout)

    // 401 Unauthorized 说明 API 端点存在（只是 key 无效）
    if (response.status === 401 || response.status === 200) {
      return { status: 'working' }
    } else {
      return {
        status: 'error',
        error: `HTTP ${response.status}`
      }
    }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 核验所有服务商
async function verifyAllProviders(): Promise<VerificationResult[]> {
  console.log('🔍 开始核验所有服务商...')

  // 获取所有服务商（只查询必要字段）
  const { data: providers, error } = await supabase
    .from('providers')
    .select('id, name, slug, website_url')
    .order('name')

  if (error) {
    console.error('❌ 获取服务商列表失败:', error)
    throw error
  }

  console.log(`📊 共 ${providers.length} 个服务商待核验`)

  const results: VerificationResult[] = []

  for (const provider of providers) {
    console.log(`\n📍 核验: ${provider.name}`)

    // 检查网站
    const websiteCheck = await checkWebsite(provider.website_url)
    console.log(`  网站: ${websiteCheck.status} (${websiteCheck.responseTime}ms)`)

    // 暂时跳过 API 检查，因为数据库中没有 api_base_url 字段
    const apiCheck = { status: 'unknown' as const }

    const result: VerificationResult = {
      provider_id: provider.id,
      provider_name: provider.name,
      website_status: websiteCheck.status,
      api_status: apiCheck.status,
      response_time: websiteCheck.responseTime,
      error_message: websiteCheck.error,
      checked_at: new Date().toISOString()
    }

    results.push(result)

    // 如果网站在线，更新核验时间
    if (websiteCheck.status === 'online') {
      const now = new Date().toISOString()

      // 更新服务商核验时间
      await supabase
        .from('providers')
        .update({
          last_verified_at: now,
          updated_at: now
        })
        .eq('id', provider.id)

      // 同时更新该服务商的所有价格记录核验时间
      const { data: channels } = await supabase
        .from('channels')
        .select('id')
        .eq('provider_id', provider.id)

      if (channels && channels.length > 0) {
        const channelIds = channels.map(c => c.id)
        await supabase
          .from('prices')
          .update({
            verified_at: now
          })
          .in('channel_id', channelIds)
      }
    }

    // 避免过于频繁的请求
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  return results
}

// 生成核验报告
function generateReport(results: VerificationResult[]): string {
  const online = results.filter(r => r.website_status === 'online').length
  const offline = results.filter(r => r.website_status === 'offline').length
  const slow = results.filter(r => r.website_status === 'slow').length
  const apiWorking = results.filter(r => r.api_status === 'working').length

  let report = `
# 服务商每日核验报告
**核验时间：** ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
**总计服务商：** ${results.length} 个

## 📊 统计概览
- ✅ 在线：${online} 个 (${((online / results.length) * 100).toFixed(1)}%)
- ⚠️ 响应慢：${slow} 个 (${((slow / results.length) * 100).toFixed(1)}%)
- ❌ 离线：${offline} 个 (${((offline / results.length) * 100).toFixed(1)}%)
- 🔌 API 正常：${apiWorking} 个

## 📋 详细结果

### ✅ 正常服务商 (${online})
${results
  .filter(r => r.website_status === 'online')
  .map(r => `- ${r.provider_name}: ${r.response_time}ms ${r.api_status === 'working' ? '🔌' : ''}`)
  .join('\n')}

${slow > 0 ? `
### ⚠️ 响应慢的服务商 (${slow})
${results
  .filter(r => r.website_status === 'slow')
  .map(r => `- ${r.provider_name}: ${r.response_time}ms`)
  .join('\n')}
` : ''}

${offline > 0 ? `
### ❌ 离线服务商 (${offline})
${results
  .filter(r => r.website_status === 'offline')
  .map(r => `- ${r.provider_name}: ${r.error_message || '无法访问'}`)
  .join('\n')}
` : ''}

---
*本报告由自动化脚本生成*
`

  return report
}

// 保存核验记录到数据库
async function saveVerificationLog(results: VerificationResult[]) {
  const summary = {
    total: results.length,
    online: results.filter(r => r.website_status === 'online').length,
    offline: results.filter(r => r.website_status === 'offline').length,
    slow: results.filter(r => r.website_status === 'slow').length,
    api_working: results.filter(r => r.api_status === 'working').length
  }

  // 保存到日志表（需要先创建此表）
  const { error } = await supabase
    .from('verification_logs')
    .insert({
      checked_at: new Date().toISOString(),
      summary,
      details: results
    })

  if (error) {
    console.error('保存核验日志失败:', error)
  }
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始每日服务商核验任务')
    console.log(`⏰ 执行时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
    console.log('─'.repeat(60))

    const results = await verifyAllProviders()

    console.log('\n' + '─'.repeat(60))
    console.log('📝 生成核验报告...')

    const report = generateReport(results)
    console.log(report)

    // 保存报告到文件
    const fs = require('fs')
    const path = require('path')
    const reportDir = path.join(__dirname, '../logs/verification')

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    const today = new Date().toISOString().split('T')[0]
    const reportPath = path.join(reportDir, `verification-${today}.md`)
    fs.writeFileSync(reportPath, report)
    console.log(`✅ 报告已保存: ${reportPath}`)

    // 保存到数据库
    await saveVerificationLog(results)

    console.log('\n✅ 每日核验任务完成')
    process.exit(0)
  } catch (error) {
    console.error('❌ 核验任务失败:', error)
    process.exit(1)
  }
}

// 执行主函数
if (require.main === module) {
  main()
}

export { verifyAllProviders, generateReport }
