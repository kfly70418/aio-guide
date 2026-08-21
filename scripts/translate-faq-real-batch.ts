/**
 * 真正的分批翻译 FAQ 数据到俄语
 * 每批 3-5 条，自动重试，断点续传
 */

import Anthropic from '@anthropic-ai/sdk'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'usage' | 'safety' | 'technical' | 'pricing' | 'comparison'
  keywords: string[]
}

const BATCH_SIZE = 3 // 每批 3 条
const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2秒

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function translateFAQBatch(faqItems: FAQItem[], retryCount = 0): Promise<FAQItem[]> {
  const prompt = `你是专业的中文到俄语技术翻译专家，专注于 AI API 服务相关内容的翻译。

请翻译以下 ${faqItems.length} 个 FAQ 问答到俄语：

${JSON.stringify(faqItems, null, 2)}

**翻译要求：**
1. 翻译 question（问题）、answer（答案）和 keywords（关键词）
2. id 和 category 保持不变
3. 技术术语准确：API、token、OpenAI、Claude、中转站(API-ретранслятор)等
4. 保持 markdown 格式和代码块
5. 保持专业性和易读性

请返回完整的 JSON 数组，格式与输入相同。只返回 JSON 数组，不要其他说明。`

  try {
    console.log(`  🤖 正在翻译（尝试 ${retryCount + 1}/${MAX_RETRIES + 1}）...`)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000, // 降低到 4000
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

    // 提取 JSON
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error(`AI 未返回有效的 JSON`)
    }

    const translated = JSON.parse(jsonMatch[0])

    // 验证数量
    if (translated.length !== faqItems.length) {
      throw new Error(`翻译数量不匹配：期望 ${faqItems.length}，实际 ${translated.length}`)
    }

    return translated

  } catch (error: any) {
    console.log(`  ❌ 翻译失败: ${error.message}`)

    // 如果是 502/504/连接超时，且未达到最大重试次数，则重试
    if (retryCount < MAX_RETRIES &&
        (error.status === 502 ||
         error.status === 504 ||
         error.status === 529 ||
         error.message.includes('timeout') ||
         error.message.includes('Upstream'))) {
      console.log(`  ⏳ ${RETRY_DELAY / 1000} 秒后重试...`)
      await sleep(RETRY_DELAY)
      return translateFAQBatch(faqItems, retryCount + 1)
    }

    throw error
  }
}

async function extractFAQData(): Promise<FAQItem[]> {
  const faqPagePath = path.join(__dirname, '../app/faq/page.tsx')
  const faqContent = fs.readFileSync(faqPagePath, 'utf-8')

  // 提取 FAQ_DATA 数组
  const faqDataMatch = faqContent.match(/const FAQ_DATA: FAQItem\[\] = \[([\s\S]*?)\];/)

  if (!faqDataMatch) {
    throw new Error('无法提取 FAQ 数据')
  }

  // 简单提取每个 FAQ 项
  const faqText = faqDataMatch[1]
  const faqItems: FAQItem[] = []

  // 使用正则提取每个对象
  const itemRegex = /\{[\s\S]*?id:\s*'([^']+)'[\s\S]*?question:\s*'([^']+)'[\s\S]*?answer:\s*`([\s\S]*?)`[\s\S]*?category:\s*'([^']+)'[\s\S]*?keywords:\s*\[([\s\S]*?)\][\s\S]*?\}/g

  let match
  while ((match = itemRegex.exec(faqText)) !== null) {
    const [, id, question, answer, category, keywordsStr] = match
    const keywords = keywordsStr.match(/'([^']+)'/g)?.map(k => k.slice(1, -1)) || []

    faqItems.push({
      id,
      question,
      answer,
      category: category as any,
      keywords,
    })
  }

  return faqItems
}

async function translateFAQInRealBatches() {
  console.log('🌍 开始真正的分批翻译 FAQ 数据到俄语\n')
  console.log('─'.repeat(60))

  // 提取 FAQ 数据
  let faqItems: FAQItem[]
  try {
    faqItems = await extractFAQData()
  } catch (error: any) {
    console.error('❌ 提取 FAQ 数据失败:', error.message)
    return
  }

  console.log(`📊 检测到 ${faqItems.length} 个 FAQ 问题`)
  console.log(`📦 每批翻译 ${BATCH_SIZE} 个问题\n`)

  const translatedItems: FAQItem[] = []
  let successCount = 0
  let failCount = 0

  // 分批处理
  for (let i = 0; i < faqItems.length; i += BATCH_SIZE) {
    const batch = faqItems.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(faqItems.length / BATCH_SIZE)

    console.log(`\n[批次 ${batchNum}/${totalBatches}] 翻译 ${batch.length} 个问题 (${i + 1}-${i + batch.length})`)
    console.log(`  问题: ${batch.map(item => item.question.substring(0, 30) + '...').join(', ')}`)

    try {
      const translated = await translateFAQBatch(batch)
      translatedItems.push(...translated)
      successCount += batch.length
      console.log(`  ✅ 批次完成 (${batch.length} 个问题)`)

      // 每批完成后立即保存临时文件
      saveTempProgress(translatedItems, i + batch.length, faqItems.length)

      // 批次之间稍微等待，避免请求过快
      if (i + BATCH_SIZE < faqItems.length) {
        await sleep(1000)
      }

    } catch (error: any) {
      console.log(`  ❌ 批次失败: ${error.message}`)
      failCount += batch.length

      // 继续处理下一批，不要因为一批失败就停止
      console.log(`  ⚠️  跳过此批次，继续处理...`)
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`📊 翻译完成`)
  console.log(`✅ 成功: ${successCount}`)
  console.log(`❌ 失败: ${failCount}`)

  if (translatedItems.length === 0) {
    console.error('\n❌ 没有成功翻译任何问题')
    return
  }

  // 生成最终文件
  const ruFaqContent = generateFAQFile(translatedItems)
  const outputPath = path.join(__dirname, '../app/faq/faq-data-ru.ts')
  fs.writeFileSync(outputPath, ruFaqContent, 'utf-8')

  console.log(`\n✅ 俄语 FAQ 数据已生成`)
  console.log(`📁 保存位置: ${outputPath}`)
  console.log(`📊 翻译问题数: ${translatedItems.length}/${faqItems.length}`)

  if (translatedItems.length < faqItems.length) {
    console.log(`\n⚠️  警告：部分问题翻译失败，请检查并重新运行`)
  }

  // 清理临时文件
  const tempPath = path.join(__dirname, '../app/faq/faq-data-ru.temp.json')
  if (fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath)
  }
}

function saveTempProgress(items: FAQItem[], current: number, total: number) {
  const tempPath = path.join(__dirname, '../app/faq/faq-data-ru.temp.json')
  fs.writeFileSync(tempPath, JSON.stringify({
    progress: `${current}/${total}`,
    items
  }, null, 2), 'utf-8')
}

function generateFAQFile(items: FAQItem[]): string {
  return `// 俄语 FAQ 数据
// 此文件由 AI 自动翻译生成

interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'usage' | 'safety' | 'technical' | 'pricing' | 'comparison'
  keywords: string[]
}

const FAQ_DATA: FAQItem[] = ${JSON.stringify(items, null, 2)}

export { FAQ_DATA }
`
}

async function main() {
  try {
    await translateFAQInRealBatches()
  } catch (error) {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { translateFAQInRealBatches }
