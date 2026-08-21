import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkTranslations() {
  console.log('🔍 检查 translations 表...\n')

  // 检查表是否存在
  const { data: tables, error: tablesError } = await supabase
    .from('translations')
    .select('*')
    .limit(1)

  if (tablesError) {
    console.log('❌ translations 表不存在:', tablesError.message)
    return
  }

  console.log('✅ translations 表存在\n')

  // 检查文章翻译数据
  const { data: articleTranslations, error: articleError } = await supabase
    .from('translations')
    .select('*')
    .eq('resource_type', 'article')
    .eq('locale', 'ru')

  if (articleError) {
    console.log('❌ 查询失败:', articleError.message)
    return
  }

  console.log(`📊 俄语文章翻译数据统计:`)
  console.log(`   总记录数: ${articleTranslations?.length || 0}`)

  if (articleTranslations && articleTranslations.length > 0) {
    // 按字段分组统计
    const fieldCount: Record<string, number> = {}
    articleTranslations.forEach(t => {
      fieldCount[t.field] = (fieldCount[t.field] || 0) + 1
    })

    console.log('\n📋 按字段统计:')
    Object.entries(fieldCount).forEach(([field, count]) => {
      console.log(`   ${field}: ${count}`)
    })

    // 显示第一条数据样例
    console.log('\n📄 示例数据:')
    const sample = articleTranslations[0]
    console.log(`   resource_id: ${sample.resource_id}`)
    console.log(`   field: ${sample.field}`)
    console.log(`   value: ${sample.value.substring(0, 100)}...`)
  } else {
    console.log('\n⚠️  没有找到俄语文章翻译数据')
  }
}

checkTranslations()
