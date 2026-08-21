/**
 * 批量翻译服务商数据到俄语
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

interface Provider {
  id: string
  name: string
  description: string
  features: string[]
}

async function translateProvider(provider: Provider): Promise<{
  name: string
  description: string
  features: string[]
}> {
  const prompt = `你是专业的中文到俄语技术翻译专家。

请翻译以下 AI API 服务商的信息到俄语：

服务商名称：${provider.name}
描述：${provider.description}
特性：${provider.features?.join(', ') || '无'}

**翻译要求：**
1. 服务商名称：如果是英文品牌名（如 API2D、OpenAI）保持原样，如果是中文名称则翻译
2. 描述：准确传达服务特点，使用俄罗斯用户熟悉的表达方式
3. 特性：技术术语保持准确性

请以 JSON 格式返回，格式如下：
{
  "name": "翻译后的名称",
  "description": "翻译后的描述",
  "features": ["特性1", "特性2"]
}

只返回 JSON，不要其他说明。`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
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

async function translateProviders() {
  console.log('🌍 开始翻译服务商数据到俄语\n')
  console.log('─'.repeat(60))

  // 1. 获取所有已发布的服务商
  const { data: providers, error } = await supabase
    .from('providers')
    .select('id, name, description, features')
    .eq('status', 'published')
    .order('sort_order', { ascending: false })

  if (error || !providers) {
    console.error('❌ 获取服务商失败:', error)
    return
  }

  console.log(`📊 共 ${providers.length} 个服务商需要翻译\n`)

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i]
    console.log(`[${i + 1}/${providers.length}] 翻译: ${provider.name}`)

    try {
      // 检查是否已有俄语翻译
      const { data: existing } = await supabase
        .from('translations')
        .select('field')
        .eq('resource_type', 'provider')
        .eq('resource_id', provider.id)
        .eq('locale', 'ru')

      if (existing && existing.length > 0) {
        console.log('  ⚠️  已存在翻译，跳过\n')
        continue
      }

      // AI 翻译
      const translated = await translateProvider(provider)

      // 保存到数据库
      const translations = [
        {
          resource_type: 'provider',
          resource_id: provider.id,
          locale: 'ru',
          field: 'name',
          value: translated.name,
        },
        {
          resource_type: 'provider',
          resource_id: provider.id,
          locale: 'ru',
          field: 'description',
          value: translated.description,
        },
      ]

      // 如果有特性，也翻译
      if (translated.features && translated.features.length > 0) {
        translations.push({
          resource_type: 'provider',
          resource_id: provider.id,
          locale: 'ru',
          field: 'features',
          value: JSON.stringify(translated.features),
        })
      }

      const { error: insertError } = await supabase.from('translations').insert(translations)

      if (insertError) {
        console.error('  ❌ 保存失败:', insertError.message)
        failCount++
      } else {
        console.log('  ✅ 翻译完成')
        console.log(`     名称: ${translated.name}`)
        console.log(`     描述: ${translated.description.substring(0, 50)}...`)
        successCount++
      }
    } catch (error: any) {
      console.error('  ❌ 翻译失败:', error.message)
      failCount++
    }

    console.log('')

    // 避免 API 限流
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log('─'.repeat(60))
  console.log(`✅ 翻译完成`)
  console.log(`📊 成功: ${successCount}，失败: ${failCount}`)
}

async function main() {
  try {
    await translateProviders()
  } catch (error) {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { translateProviders }
