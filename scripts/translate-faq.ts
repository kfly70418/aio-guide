/**
 * 批量翻译 FAQ 数据到俄语
 * FAQ 数据存储在代码中，需要生成俄语版本的 FAQ 数据文件
 */

import Anthropic from '@anthropic-ai/sdk'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

async function translateFAQ() {
  console.log('🌍 开始翻译 FAQ 数据到俄语\n')
  console.log('─'.repeat(60))

  // 读取中文 FAQ 页面
  const faqPagePath = path.join(__dirname, '../app/faq/page.tsx')
  const faqContent = fs.readFileSync(faqPagePath, 'utf-8')

  // 提取 FAQ_DATA 数组（匹配到数组结束的分号）
  const faqDataMatch = faqContent.match(/const FAQ_DATA: FAQItem\[\] = \[([\s\S]*?)\];/)

  if (!faqDataMatch) {
    console.error('❌ 无法提取 FAQ 数据')
    return
  }

  const prompt = `你是专业的中文到俄语技术翻译专家，专注于 AI API 服务相关内容的翻译。

我有一个 FAQ（常见问题）页面需要翻译成俄语。以下是原始的中文 FAQ 数据（TypeScript 格式）。

**翻译要求：**
1. 翻译所有的 question（问题）和 answer（答案）字段
2. 保持代码结构完全一致
3. 技术术语保持准确：API、token、OpenAI、Claude 等
4. 代码示例中的注释也要翻译
5. 保持 markdown 格式（如代码块、列表等）
6. id 和 category 字段不翻译
7. keywords 数组翻译成俄语关键词

原始数据：
${faqDataMatch[0]}

请返回完整的俄语版本的 FAQ_DATA 数组定义（TypeScript 格式），确保可以直接复制到代码中使用。`

  console.log('🤖 正在使用 AI 翻译 FAQ...\n')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

  // 提取代码块
  const codeMatch = responseText.match(/```(?:typescript|ts)?\n([\s\S]*?)```/) ||
                     responseText.match(/const FAQ_DATA[\s\S]*?\]/m)

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

  console.log('✅ 俄语 FAQ 数据已生成')
  console.log(`📁 保存位置: ${outputPath}`)

  // 统计问题数量
  const questionCount = (translatedCode.match(/question:/g) || []).length
  console.log(`📊 翻译问题数: ${questionCount}`)
}

async function main() {
  try {
    await translateFAQ()
  } catch (error) {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { translateFAQ }
