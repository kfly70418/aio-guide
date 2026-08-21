/**
 * 统一翻译执行脚本
 * 按顺序执行所有翻译任务
 */

import { translateProviders } from './translate-providers'
import { translateModels } from './translate-models'
import { translateFAQ } from './translate-faq'

async function translateAll() {
  console.log('🚀 开始执行完整的俄语翻译任务\n')
  console.log('═'.repeat(60))

  try {
    // 1. 翻译 UI 字典（已完成）
    console.log('\n✅ Step 1: UI 字典翻译（已完成）')

    // 2. 翻译服务商数据
    console.log('\n📦 Step 2: 翻译服务商数据')
    console.log('─'.repeat(60))
    await translateProviders()

    // 3. 翻译模型数据
    console.log('\n🤖 Step 3: 翻译模型数据')
    console.log('─'.repeat(60))
    await translateModels()

    // 4. 翻译 FAQ 数据
    console.log('\n❓ Step 4: 翻译 FAQ 数据')
    console.log('─'.repeat(60))
    await translateFAQ()

    console.log('\n═'.repeat(60))
    console.log('🎉 所有翻译任务已完成！')
    console.log('\n下一步：')
    console.log('1. 在 Supabase 控制台执行 SQL 创建 translations 表')
    console.log('2. 重构路由结构，将 app/* 移到 app/[locale]/*')
    console.log('3. 更新组件使用翻译')
    console.log('4. 测试俄语版本')
  } catch (error) {
    console.error('\n❌ 翻译任务失败:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  translateAll()
}

export { translateAll }
