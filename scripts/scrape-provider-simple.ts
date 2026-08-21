/**
 * 简化版服务商数据采集工具（不使用浏览器）
 *
 * 功能：
 * 1. 使用简单的 HTTP 请求获取页面
 * 2. AI 解析 HTML 内容
 * 3. 生成结构化数据
 */

import Anthropic from '@anthropic-ai/sdk'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

interface ProviderData {
  name: string
  name_en?: string
  website_url: string
  description: string
  features: string[]
  min_topup?: string
  trial_credit?: string
  payment_methods?: string[]
  api_base_url?: string
  models: Array<{
    model_name: string
    price_input?: number
    price_output?: number
    currency: string
  }>
  support: {
    email?: string
    qq?: string
    telegram?: string
    wechat?: string
    docs_url?: string
  }
  confidence_score: number
}

// 简单获取网页内容
async function fetchPageContent(url: string): Promise<string> {
  console.log(`📡 正在访问: ${url}`)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(15000)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // 简单提取文本内容
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return text
  } catch (error: any) {
    throw new Error(`访问失败: ${error.message}`)
  }
}

// 使用 AI 解析内容
async function parseWithAI(content: string, url: string): Promise<ProviderData> {
  console.log('🤖 使用 AI 解析内容...')

  const prompt = `你是一个专业的数据提取助手。请从以下 API 中转站服务商网站的内容中提取结构化信息。

网站 URL: ${url}

网站内容：
${content.substring(0, 15000)}

请提取以下信息并以 JSON 格式返回：

{
  "name": "服务商中文名称",
  "name_en": "服务商英文名称（如果有）",
  "website_url": "${url}",
  "description": "一句话描述（30-50字）",
  "features": ["特性1", "特性2", "特性3"],
  "min_topup": "最低充值金额（如：¥10）",
  "trial_credit": "新人试用额度（如：¥5）",
  "payment_methods": ["支付宝", "微信", "USDT"],
  "api_base_url": "API 基础地址",
  "models": [
    {
      "model_name": "gpt-4o",
      "price_input": 3.5,
      "price_output": 14.0,
      "currency": "CNY"
    }
  ],
  "support": {
    "email": "客服邮箱",
    "qq": "QQ 号码或群",
    "telegram": "Telegram 账号",
    "wechat": "微信号",
    "docs_url": "文档地址"
  },
  "confidence_score": 85
}

注意：
1. 如果某个字段找不到信息，设为 null
2. 价格单位统一为"每百万 token"
3. 特性标签要简洁有力（如：国内直连、多模型、稳定、低价）
4. confidence_score 基于信息的清晰度和完整性打分（0-100）

只返回 JSON，不要其他说明。`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    throw new Error('AI 未能返回有效 JSON')
  }

  return JSON.parse(jsonMatch[0]) as ProviderData
}

// 保存结果
function saveResult(data: ProviderData, outputPath: string) {
  const outputDir = path.dirname(outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`✅ 数据已保存: ${outputPath}`)
  console.log(`📊 可信度评分: ${data.confidence_score}/100`)
}

// 采集单个服务商
async function scrapeProvider(url: string) {
  console.log('\n🚀 开始采集服务商数据')
  console.log('─'.repeat(60))

  try {
    const content = await fetchPageContent(url)
    console.log(`✅ 页面内容提取完成 (${content.length} 字符)`)

    const data = await parseWithAI(content, url)
    console.log(`✅ AI 解析完成`)

    const timestamp = new Date().toISOString().split('T')[0]
    const safeName = url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-')
    const outputPath = `./data/scraped/${timestamp}-${safeName}.json`

    saveResult(data, outputPath)

    console.log('\n' + '─'.repeat(60))
    console.log('📋 采集结果摘要:')
    console.log(`   服务商: ${data.name}`)
    console.log(`   描述: ${data.description}`)
    console.log(`   特性: ${data.features.join(', ')}`)
    console.log(`   模型数: ${data.models.length}`)
    console.log(`   可信度: ${data.confidence_score}/100`)
    console.log('─'.repeat(60))

    if (data.confidence_score < 70) {
      console.log('⚠️  注意: 可信度较低，建议人工核验')
    }

    return data
  } catch (error) {
    console.error('❌ 采集失败:', error)
    throw error
  }
}

// 批量采集
async function scrapeBatch() {
  console.log('📦 批量采集模式')
  console.log('─'.repeat(60))

  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: providers, error } = await supabase
    .from('providers')
    .select('id, name, slug, website_url')
    .not('website_url', 'is', null)
    .order('name')

  if (error) {
    console.error('❌ 获取服务商列表失败:', error)
    return
  }

  console.log(`📊 共 ${providers.length} 个服务商待采集\n`)

  const results = []

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i]
    console.log(`\n[${i + 1}/${providers.length}] 采集: ${provider.name}`)

    try {
      const data = await scrapeProvider(provider.website_url)
      results.push({
        provider_id: provider.id,
        slug: provider.slug,
        data,
      })
    } catch (error) {
      console.error(`❌ 采集失败: ${provider.name}`)
      results.push({
        provider_id: provider.id,
        slug: provider.slug,
        error: String(error),
      })
    }

    // 避免请求过快
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }

  // 保存批量结果
  const timestamp = new Date().toISOString().split('T')[0]
  const batchPath = `./data/scraped/batch-${timestamp}.json`

  fs.mkdirSync('./data/scraped', { recursive: true })
  fs.writeFileSync(batchPath, JSON.stringify(results, null, 2), 'utf-8')

  console.log(`\n✅ 批量采集完成，结果已保存: ${batchPath}`)
  console.log(`📊 成功: ${results.filter((r) => !r.error).length}/${results.length}`)
}

// 主函数
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('用法:')
    console.log('  单个采集: npx tsx scripts/scrape-provider-simple.ts <url>')
    console.log('  批量采集: npx tsx scripts/scrape-provider-simple.ts --batch')
    process.exit(1)
  }

  if (args[0] === '--batch') {
    await scrapeBatch()
  } else {
    await scrapeProvider(args[0])
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  })
}

export { scrapeProvider, scrapeBatch }
