/**
 * 批量翻译模型数据到俄语
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Model {
  id: string
  name: string
  description: string | null
  family: string
}

async function translateModel(model: Model): Promise<{
  name: string
  description: string
}> {
  const prompt = `你是专业的中文到俄语技术翻译专家。

请翻译以下 AI 模型信息到俄语：

模型名称：${model.name}
模型系列：${model.family}
描述：${model.description || '无'}

**翻译要求：**
1. 模型名称：保持英文原样（如 GPT-4o, Claude Opus 5）
2. 描述：如果有描述则翻译，准确传达模型特点
3. 如果没有描述，根据模型名称生成一个简短的俄语描述（1-2句话）

请以 JSON 格式返回，格式如下：
{
  "name": "${model.name}",
  "description": "俄语描述"
}

只返回 JSON，不要其他说明。`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

  // 提取 JSON
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error(`AI 未返回有效的 JSON: ${responseText}`)
  }

  return JSON.parse(jsonMatch[0])
}

async function translateModels() {
  console.log('🌍 开始翻译模型数据到俄语\n')
  console.log('─'.repeat(60))

  // 1. 获取所有已发布的模型
  const { data: models, error } = await supabase
    .from('models')
    .select('id, name, description, family')
    .eq('status', 'published')
    .order('family', { ascending: true })
    .order('name', { ascending: true })

  if (error || !models) {
    console.error('❌ 获取模型失败:', error)
    return
  }

  console.log(`📊 共 ${models.length} 个模型需要翻译\n`)

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    console.log(`[${i + 1}/${models.length}] 翻译: ${model.name}`)

    try {
      // 检查是否已有俄语翻译
      const { data: existing } = await supabase
        .from('translations')
        .select('field')
        .eq('resource_type', 'model')
        .eq('resource_id', model.id)
        .eq('locale', 'ru')

      if (existing && existing.length > 0) {
        console.log('  ⚠️  已存在翻译，跳过\n')
        continue
      }

      // AI 翻译
      const translated = await translateModel(model)

      // 保存到数据库
      const translations = [
        {
          resource_type: 'model',
          resource_id: model.id,
          locale: 'ru',
          field: 'name',
          value: translated.name,
        },
        {
          resource_type: 'model',
          resource_id: model.id,
          locale: 'ru',
          field: 'description',
          value: translated.description,
        },
      ]

      const { error: insertError } = await supabase.from('translations').insert(translations)

      if (insertError) {
        console.error('  ❌ 保存失败:', insertError.message)
        failCount++
      } else {
        console.log('  ✅ 翻译完成')
        console.log(`     描述: ${translated.description}`)
        successCount++
      }
    } catch (error: any) {
      console.error('  ❌ 翻译失败:', error.message)
      failCount++
    }

    console.log('')

    // 避免 API 限流
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  console.log('─'.repeat(60))
  console.log(`✅ 翻译完成`)
  console.log(`📊 成功: ${successCount}，失败: ${failCount}`)
}

async function main() {
  try {
    await translateModels()
  } catch (error) {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { translateModels }
