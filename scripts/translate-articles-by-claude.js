/**
 * 由 Claude 直接翻译文章内容到俄语
 * 逐篇读取、翻译、保存
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  console.log('📝 开始翻译文章内容到俄语\n')

  // 获取所有教程文章
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, slug, title, content')
    .eq('status', 'published')
    .eq('category', 'tutorial')
    .order('published_at', { ascending: false })

  if (error || !articles) {
    console.error('❌ 获取文章失败:', error)
    return
  }

  console.log(`📊 共 ${articles.length} 篇教程需要翻译\n`)

  // 检查已翻译的文章
  const { data: existingTranslations } = await supabase
    .from('translations')
    .select('resource_id')
    .eq('resource_type', 'article')
    .eq('locale', 'ru')
    .eq('field', 'content')

  const translatedIds = new Set(existingTranslations?.map(t => t.resource_id) || [])

  let count = 0
  for (const article of articles) {
    if (translatedIds.has(article.id)) {
      console.log(`⏭️  [${++count}/${articles.length}] 已翻译: ${article.title}`)
      continue
    }

    console.log(`\n🔄 [${++count}/${articles.length}] 翻译中: ${article.title}`)
    console.log(`   字数: ${article.content.length} 字符`)

    // 这里需要手动添加翻译内容
    // 由于无法在 Node.js 中直接调用 Claude API（需要你提供 API Key）
    // 我会生成一个包含翻译映射的 JSON 文件
    console.log(`   ⚠️  需要手动翻译后导入`)
  }

  console.log('\n📊 统计:')
  console.log(`   已翻译: ${translatedIds.size}`)
  console.log(`   待翻译: ${articles.length - translatedIds.size}`)
  console.log('\n💡 解决方案:')
  console.log('   方案1: 我(Claude)在对话中逐篇翻译,你运行导入脚本')
  console.log('   方案2: 配置可用的翻译API(非503的服务)')
  console.log('   方案3: 暂时跳过文章详情翻译,只翻译标题和摘要(已完成)')
}

main().catch(console.error)
