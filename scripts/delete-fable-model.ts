/**
 * 删除 Claude Fable 5 模型
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function deleteFableModel() {
  console.log('🗑️  开始删除 Claude Fable 5 模型\n')
  console.log('─'.repeat(60))

  try {
    // 1. 查找 Fable 模型
    const { data: fableModel, error: findError } = await supabase
      .from('models')
      .select('id, name, slug')
      .ilike('name', '%fable%')
      .single()

    if (findError || !fableModel) {
      console.log('⚠️  未找到 Fable 模型')
      return
    }

    console.log(`找到模型: ${fableModel.name} (${fableModel.slug})`)
    console.log(`模型 ID: ${fableModel.id}`)

    // 2. 删除价格历史记录
    const { error: deletePriceError } = await supabase
      .from('price_history')
      .delete()
      .eq('model_id', fableModel.id)

    if (deletePriceError) {
      console.error('❌ 删除价格历史失败:', deletePriceError.message)
    } else {
      console.log('✅ 已删除价格历史记录')
    }

    // 3. 删除相关的翻译数据
    const { error: deleteTransError } = await supabase
      .from('translations')
      .delete()
      .eq('resource_type', 'model')
      .eq('resource_id', fableModel.id)

    if (deleteTransError) {
      console.error('❌ 删除翻译数据失败:', deleteTransError.message)
    } else {
      console.log('✅ 已删除翻译数据')
    }

    // 4. 删除模型本身
    const { error: deleteModelError } = await supabase
      .from('models')
      .delete()
      .eq('id', fableModel.id)

    if (deleteModelError) {
      console.error('❌ 删除模型失败:', deleteModelError.message)
      return
    }

    console.log('✅ 已删除模型')
    console.log('\n' + '─'.repeat(60))
    console.log('✅ Claude Fable 5 删除完成')

  } catch (error: any) {
    console.error('❌ 删除过程出错:', error.message)
  }
}

if (require.main === module) {
  deleteFableModel().catch(console.error)
}
