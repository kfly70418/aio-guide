/**
 * AI 翻译工具 - 将中文字典翻译成俄语
 */

import Anthropic from '@anthropic-ai/sdk'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.join(__dirname, '../../.env.local') })

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

async function translateDictionary() {
  console.log('🌍 开始翻译字典文件...\n')

  // 读取中文字典
  const zhPath = path.join(__dirname, '../lib/i18n/dictionaries/zh.json')
  const zhDict = JSON.parse(fs.readFileSync(zhPath, 'utf-8'))

  const prompt = `你是一个专业的中文到俄语翻译专家，专注于技术和网站本地化翻译。

请将以下中文 JSON 翻译成俄语。注意：

**翻译要求：**
1. 保持 JSON 结构完全一致，只翻译值（value），不翻译键（key）
2. 技术术语保持准确：API、token、SDK 等专业词汇
3. 保持简洁：UI 文本要短小精悍
4. 符合俄语习惯：使用俄罗斯用户熟悉的表达方式
5. 货币符号保持原样：¥、₽、$ 不翻译
6. 品牌名称保持原样：OpenAI、Claude、GPT 等

**特殊说明：**
- "AI API 中转站" = "API-прокси для ИИ" 或 "Ретрансляторы API для ИИ"
- "服务商" = "Провайдер"
- "模型" = "Модель"
- "充值" = "Пополнение"
- "试用额度" = "Пробный кредит"
- "开票" = "Выставление счёта"

中文 JSON：
${JSON.stringify(zhDict, null, 2)}

请返回完整的俄语 JSON，确保格式正确且可以被 JSON.parse() 解析。只返回 JSON，不要其他说明。`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

  // 提取 JSON
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('AI 未返回有效的 JSON')
  }

  const ruDict = JSON.parse(jsonMatch[0])

  // 保存俄语字典
  const ruPath = path.join(__dirname, '../lib/i18n/dictionaries/ru.json')
  fs.writeFileSync(ruPath, JSON.stringify(ruDict, null, 2), 'utf-8')

  console.log('✅ 俄语字典已生成')
  console.log(`📁 保存位置: ${ruPath}`)
  console.log(`📊 翻译条目数: ${Object.keys(flatten(ruDict)).length}`)
}

// 扁平化对象以计数
function flatten(obj: any, prefix = ''): Record<string, string> {
  let result: Record<string, string> = {}

  for (const key in obj) {
    const value = obj[key]
    const newKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result = { ...result, ...flatten(value, newKey) }
    } else {
      result[newKey] = String(value)
    }
  }

  return result
}

async function main() {
  try {
    await translateDictionary()
  } catch (error) {
    console.error('❌ 翻译失败:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { translateDictionary }
