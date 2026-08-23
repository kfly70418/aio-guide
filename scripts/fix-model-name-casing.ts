/**
 * 修复模型名称大小写规范化
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 正确的模型名称映射（规范化大小写）
const correctModelNames: Record<string, string> = {
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-35-turbo': 'GPT-3.5 Turbo',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'claude-sonnet-4': 'Claude Sonnet 4.6',
  'claude-opus-4': 'Claude Opus 4.7',
  'gemini-pro': 'Gemini Pro',
  'gemini-15-pro': 'Gemini 1.5 Pro',
  'gemini-15-flash': 'Gemini 1.5 Flash',
}

async function fixModelNameCasing() {
  console.log('🔧 开始修复模型名称大小写\n')
  console.log('─'.repeat(60))

  let successCount = 0
  let failCount = 0
  let skippedCount = 0

  for (const [slug, correctName] of Object.entries(correctModelNames)) {
    console.log(`处理: ${slug} → ${correctName}`)

    try {
      // 1. 查找模型
      const { data: model, error: modelError } = await supabase
        .from('models')
        .select('id, name, slug')
        .eq('slug', slug)
        .single()

      if (modelError || !model) {
        console.log(`  ⚠️  未找到模型: ${slug}`)
        skippedCount++
        continue
      }

      console.log(`  ℹ️  模型 ID: ${model.id}, 当前名称: ${model.name}`)

      // 2. 更新模型名称
      const { error: updateError } = await supabase
        .from('models')
        .update({ name: correctName })
        .eq('id', model.id)

      if (updateError) {
        console.error(`  ❌ 更新失败:`, updateError.message)
        failCount++
      } else {
        console.log(`  ✅ 已更新为: ${correctName}`)
        successCount++
      }

      // 3. 更新翻译表中的名称（中文和俄语）
      const { error: transError } = await supabase
        .from('translations')
        .update({ value: correctName })
        .eq('resource_type', 'model')
        .eq('resource_id', model.id)
        .eq('field', 'name')

      if (transError) {
        console.log(`  ⚠️  更新翻译失败:`, transError.message)
      } else {
        console.log(`  ✅ 翻译也已更新`)
      }
    } catch (error: any) {
      console.error(`  ❌ 处理失败:`, error.message)
      failCount++
    }

    console.log()
  }

  console.log('─'.repeat(60))
  console.log(`✅ 修复完成`)
  console.log(`📊 成功: ${successCount}，失败: ${failCount}，跳过: ${skippedCount}`)
}

if (require.main === module) {
  fixModelNameCasing().catch(console.error)
}
