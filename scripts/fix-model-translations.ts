/**
 * 修复模型俄语翻译数据错位问题
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 正确的模型名称映射
const correctModelNames: Record<string, string> = {
  'claude-sonnet-5': 'Claude Sonnet 5',
  'claude-opus-5': 'Claude Opus 5',
  'claude-opus-47': 'Claude Opus 4.7',
  'claude-sonnet-46': 'Claude Sonnet 4.6',
  'claude-haiku-45': 'Claude Haiku 4.5',
  'deepseek-v4': 'DeepSeek V4',
  'deepseek-v4-pro': 'DeepSeek V4 Pro',
}

async function fixModelTranslations() {
  console.log('🔧 开始修复模型俄语翻译\n')
  console.log('─'.repeat(60))

  let successCount = 0
  let failCount = 0
  let skippedCount = 0

  for (const [slug, correctName] of Object.entries(correctModelNames)) {
    console.log(`处理: ${slug} → ${correctName}`)

    try {
      // 1. 获取模型 ID
      const { data: model, error: modelError } = await supabase
        .from('models')
        .select('id, name')
        .eq('slug', slug)
        .single()

      if (modelError || !model) {
        console.log(`  ⚠️  未找到模型: ${slug}`)
        skippedCount++
        continue
      }

      console.log(`  ℹ️  模型 ID: ${model.id}, 当前名称: ${model.name}`)

      // 2. 检查当前的俄语翻译
      const { data: currentTranslation } = await supabase
        .from('translations')
        .select('value')
        .eq('resource_type', 'model')
        .eq('resource_id', model.id)
        .eq('locale', 'ru')
        .eq('field', 'name')
        .single()

      if (currentTranslation) {
        console.log(`  📝 当前翻译: ${currentTranslation.value}`)
      }

      // 3. 更新或插入正确的翻译
      const { error: upsertError } = await supabase
        .from('translations')
        .upsert({
          resource_type: 'model',
          resource_id: model.id,
          locale: 'ru',
          field: 'name',
          value: correctName,
        }, {
          onConflict: 'resource_type,resource_id,locale,field',
        })

      if (upsertError) {
        console.error(`  ❌ 更新失败:`, upsertError.message)
        failCount++
      } else {
        console.log(`  ✅ 已更新为: ${correctName}`)
        successCount++
      }
    } catch (error: any) {
      console.error(`  ❌ 处理失败:`, error.message)
      failCount++
    }

    console.log()
  }

  // 检查并删除 Claude Fable 5（如果存在）
  console.log('检查 Claude Fable 5...')
  const { data: fableModel } = await supabase
    .from('models')
    .select('id, name, slug')
    .ilike('name', '%fable%')
    .single()

  if (fableModel) {
    console.log(`  ⚠️  发现可疑模型: ${fableModel.name} (${fableModel.slug})`)
    console.log(`  ℹ️  请手动确认是否需要删除或标记为"供应商自定义模型"`)
  } else {
    console.log(`  ✅ 未发现 Fable 模型`)
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`✅ 修复完成`)
  console.log(`📊 成功: ${successCount}，失败: ${failCount}，跳过: ${skippedCount}`)
}

if (require.main === module) {
  fixModelTranslations().catch(console.error)
}
