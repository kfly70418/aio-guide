/**
 * 服务商数据自动采集工具
 *
 * 功能：
 * 1. 从服务商官网提取结构化数据
 * 2. 使用 AI 辅助解析页面内容
 * 3. 生成待核验的数据 JSON
 * 4. 支持批量处理
 *
 * 使用方法：
 * npx tsx scripts/scrape-provider-data.ts <provider-url>
 * 或批量：npx tsx scripts/scrape-provider-data.ts --batch
 */

import { chromium } from 'playwright'
import Anthropic from '@anthropic-ai/sdk'
import * as dotenv from 'dotenv'
import * as path from 'path'

// 加载 .env.local 文件
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
  confidence_score: number // 0-100，数据可信度
  raw_html?: string // 保存原始 HTML 用于人工核验
}

// 从网页提取文本内容
async function extractPageContent(url: string): Promise<{
  text: string
  html: string
  screenshots: { name: string; data: Buffer }[]
}> {
  console.log(`📡 正在访问: ${url}`)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

    // 提取页面文本
    const text = await page.evaluate(() => document.body.innerText)

    // 提取 HTML
    const html = await page.content()

    // 截图关键页面
    const screenshots: { name: string; data: Buffer }[] = []

    // 首页截图
    screenshots.push({
      name: 'homepage',
      data: await page.screenshot({ fullPage: true }),
    })

    // 尝试访问价格页面
    const priceLinks = await page.$$eval('a', (links) =>
      links
        .filter((link) =>
          /价格|pricing|price|费用|充值|套餐/i.test(link.textContent || '')
        )
        .map((link) => link.href)
    )

    if (priceLinks.length > 0) {
      try {
        await page.goto(priceLinks[0], { waitUntil: 'networkidle', timeout: 15000 })
        screenshots.push({
          name: 'pricing',
          data: await page.screenshot({ fullPage: true }),
        })
      } catch (e) {
        console.log('⚠️  无法访问价格页面')
      }
    }

    return { text, html, screenshots }
  } catch (error) {
    throw new Error(`访问失败: ${error}`)
  } finally {
    await browser.close()
  }
}

// 使用 AI 解析页面内容
async function parseWithAI(content: string, url: string): Promise<ProviderData> {
  console.log('🤖 使用 AI 解析内容...')

  const prompt = `你是一个专业的数据提取助手。请从以下 API 中转站服务商网站的内容中提取结构化信息。

网站 URL: ${url}

网站内容：
${content.substring(0, 15000)} // 限制长度避免超出 token 限制

请提取以下信息并以 JSON 格式返回：

{
  "name": "服务商中文名称",
  "name_en": "服务商英文名称（如果有）",
  "website_url": "${url}",
  "description": "一句话描述（30-50字）",
  "features": ["特性1", "特性2", "特性3"], // 3-5个特性标签，如：国内直连、多模型、稳定、低价等
  "min_topup": "最低充值金额（如：¥10）",
  "trial_credit": "新人试用额度（如：¥5）",
  "payment_methods": ["支付方式1", "支付方式2"], // 如：支付宝、微信、USDT
  "api_base_url": "API 基础地址（如：https://api.xxx.com/v1）",
  "models": [
    {
      "model_name": "gpt-4o",
      "price_input": 输入价格数字,
      "price_output": 输出价格数字,
      "currency": "CNY或USD"
    }
  ],
  "support": {
    "email": "客服邮箱",
    "qq": "QQ 号码或群",
    "telegram": "Telegram 账号",
    "wechat": "微信号",
    "docs_url": "文档地址"
  },
  "confidence_score": 0-100 // 你对提取数据准确性的信心分数
}

注意：
1. 如果某个字段找不到信息，设为 null
2. 价格单位统一为"每百万 token"
3. 特性标签要简洁有力
4. confidence_score 基于信息的清晰度和完整性打分

只返回 JSON，不要其他说明。`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

  // 提取 JSON
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('AI 未能返回有效 JSON')
  }

  const data = JSON.parse(jsonMatch[0]) as ProviderData
  return data
}

// 保存采集结果
function saveResult(data: ProviderData, outputPath: string) {
  const fs = require('fs')
  const path = require('path')

  // 创建输出目录
  const outputDir = path.dirname(outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // 保存 JSON
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')

  console.log(`✅ 数据已保存: ${outputPath}`)
  console.log(`📊 可信度评分: ${data.confidence_score}/100`)
}

// 单个服务商采集
async function scrapeProvider(url: string) {
  console.log('\n🚀 开始采集服务商数据')
  console.log('─'.repeat(60))

  try {
    // 1. 提取页面内容
    const { text, html, screenshots } = await extractPageContent(url)
    console.log(`✅ 页面内容提取完成 (${text.length} 字符)`)

    // 2. AI 解析
    const data = await parseWithAI(text, url)
    console.log(`✅ AI 解析完成`)

    // 3. 保存结果
    const timestamp = new Date().toISOString().split('T')[0]
    const safeName = url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-')
    const outputPath = `./data/scraped/${timestamp}-${safeName}.json`

    saveResult(data, outputPath)

    // 4. 保存截图
    const fs = require('fs')
    screenshots.forEach((screenshot, idx) => {
      const screenshotPath = `./data/scraped/${timestamp}-${safeName}-${screenshot.name}.png`
      fs.writeFileSync(screenshotPath, screenshot.data)
      console.log(`📸 截图已保存: ${screenshotPath}`)
    })

    // 5. 显示摘要
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

// 批量采集（从数据库读取服务商列表）
async function scrapeBatch() {
  console.log('📦 批量采集模式')
  console.log('─'.repeat(60))

  const { createClient } = require('@supabase/supabase-js')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 获取所有需要补充数据的服务商
  const { data: providers, error } = await supabase
    .from('providers')
    .select('id, name, slug, website_url')
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

    if (!provider.website_url) {
      console.log('⚠️  跳过: 无官网地址')
      continue
    }

    try {
      const data = await scrapeProvider(provider.website_url)
      results.push({
        provider_id: provider.id,
        slug: provider.slug,
        data,
      })

      // 避免请求过快
      await new Promise((resolve) => setTimeout(resolve, 5000))
    } catch (error) {
      console.error(`❌ 采集失败: ${provider.name}`)
      results.push({
        provider_id: provider.id,
        slug: provider.slug,
        error: String(error),
      })
    }
  }

  // 保存批量结果
  const fs = require('fs')
  const timestamp = new Date().toISOString().split('T')[0]
  const batchPath = `./data/scraped/batch-${timestamp}.json`
  fs.writeFileSync(batchPath, JSON.stringify(results, null, 2), 'utf-8')

  console.log(`\n✅ 批量采集完成，结果已保存: ${batchPath}`)
  console.log(`📊 成功: ${results.filter((r) => !r.error).length}/${results.length}`)
}

// 主函数
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('用法:')
    console.log('  单个采集: npx tsx scripts/scrape-provider-data.ts <url>')
    console.log('  批量采集: npx tsx scripts/scrape-provider-data.ts --batch')
    process.exit(1)
  }

  if (args[0] === '--batch') {
    await scrapeBatch()
  } else {
    await scrapeProvider(args[0])
  }
}

// 执行
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  })
}

export { scrapeProvider, scrapeBatch, parseWithAI }
