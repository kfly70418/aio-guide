/**
 * 批量翻译 FAQ 数据到俄语（分批处理）
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

async function translateFAQBatch(faqItems: FAQItem[]): Promise<FAQItem[]> {
  const prompt = `你是专业的中文到俄语技术翻译专家，专注于 AI API 服务相关内容的翻译。

请翻译以下 ${faqItems.length} 个 FAQ 问答到俄语：

${JSON.stringify(faqItems, null, 2)}

**翻译要求：**
1. 翻译 question（问题）、answer（答案）和 keywords（关键词）
2. id 和 category 保持不变
3. 技术术语准确：API、token、OpenAI、Claude 等
4. 保持 markdown 格式和代码块
5. 保持专业性和易读性

请返回完整的 JSON 数组，格式与输入相同。只返回 JSON，不要其他说明。`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

  // 提取 JSON
  const jsonMatch = responseText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error(`AI 未返回有效的 JSON: ${responseText.substring(0, 200)}`)
  }

  return JSON.parse(jsonMatch[0])
}

async function translateFAQInBatches() {
  console.log('🌍 开始批量翻译 FAQ 数据到俄语\n')
  console.log('─'.repeat(60))

  // 读取中文 FAQ 页面
  const faqPagePath = path.join(__dirname, '../app/faq/page.tsx')
  const faqContent = fs.readFileSync(faqPagePath, 'utf-8')

  // 提取 FAQ_DATA 数组
  const faqDataMatch = faqContent.match(/const FAQ_DATA: FAQItem\[\] = \[([\s\S]*?)\];/)

  if (!faqDataMatch) {
    console.error('❌ 无法提取 FAQ 数据')
    return
  }

  // 解析 FAQ 数据（简化版 - 手动提取）
  const faqText = faqDataMatch[1]

  // 统计问题数量
  const questionCount = (faqText.match(/question:/g) || []).length
  console.log(`📊 检测到 ${questionCount} 个 FAQ 问题`)
  console.log(`📦 将分批翻译，每批 5 个问题\n`)

  // 由于提取复杂，我们采用简化方案：直接用 AI 翻译整个文件的 FAQ 部分
  const prompt = `你是专业的中文到俄语技术翻译专家。

以下是 TypeScript FAQ 数据结构的一部分。请将所有的 question、answer 和 keywords 字段翻译成俄语。
保持代码结构、id、category 不变。

${faqDataMatch[0]}

请返回完整的翻译后的代码，保持相同的 TypeScript 格式。`

  console.log('🤖 正在使用 AI 翻译...')

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

    // 提取代码块
    const codeMatch = responseText.match(/```(?:typescript|ts)?\n([\s\S]*?)```/) ||
                       responseText.match(/const FAQ_DATA[\s\S]*?\];/)

    if (!codeMatch) {
      console.error('❌ AI 未返回有效的代码')
      console.log('响应内容:', responseText.substring(0, 500))
      return
    }

    const translatedCode = codeMatch[1] || codeMatch[0]

    // 创建俄语 FAQ 数据文件
    const ruFaqContent = `// 俄语 FAQ 数据
// 此文件由 AI 自动翻译生成

interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'usage' | 'safety' | 'technical' | 'pricing' | 'comparison'
  keywords: string[]
}

${translatedCode}

export { FAQ_DATA }
`

    const outputPath = path.join(__dirname, '../app/faq/faq-data-ru.ts')
    fs.writeFileSync(outputPath, ruFaqContent, 'utf-8')

    console.log('\n✅ 俄语 FAQ 数据已生成')
    console.log(`📁 保存位置: ${outputPath}`)

    // 统计翻译的问题数量
    const translatedQuestionCount = (translatedCode.match(/question:/g) || []).length
    console.log(`📊 翻译问题数: ${translatedQuestionCount}`)

    if (translatedQuestionCount < questionCount) {
      console.log(`⚠️  警告：翻译的问题数量 (${translatedQuestionCount}) 少于原始数量 (${questionCount})`)
    }

  } catch (error: any) {
    console.error('❌ 翻译失败:', error.message)
    throw error
  }
}

async function main() {
  try {
    await translateFAQInBatches()
  } catch (error) {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { translateFAQInBatches }
