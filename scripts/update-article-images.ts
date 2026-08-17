import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function updateArticleWithImages() {
  const contentPath = 'D:/Websites/aio-guide/data/article-api-key-leaked-emergency.md'
  let content = fs.readFileSync(contentPath, 'utf-8')

  // 替换图片占位符为实际图片路径
  const imageReplacements = [
    {
      old: '![紧急止损操作时间线](需要配图：时间线流程图，显示 1/3/5/10/30 分钟节点的关键操作)',
      new: '![紧急止损操作时间线](/images/articles/api-key-leaked-timeline_1536x656.png)'
    },
    {
      old: '![异常消费识别示意图](需要配图：对比正常vs异常的消费曲线图)',
      new: '![异常消费识别示意图](/images/articles/api-usage-normal-vs-abnormal_1536x656.png)'
    },
    {
      old: '![密钥更换检查清单](需要配图：5 项检查清单的勾选框视觉图)',
      new: '![密钥更换检查清单](/images/articles/api-key-replacement-checklist_1536x656.png)'
    },
    {
      old: '![安全措施对比图](需要配图：安全vs不安全的存储方式对比)',
      new: '![安全措施对比图](/images/articles/secure-vs-insecure-storage_1536x656.png)'
    },
    {
      old: '![泄露途径统计](需要配图：饼图显示 4 种泄露途径的占比)',
      new: '![泄露途径统计](/images/articles/api-key-leak-sources-pie-chart_1536x656.png)'
    }
  ]

  imageReplacements.forEach(({ old, new: newPath }) => {
    content = content.replace(old, newPath)
  })

  // 更新数据库
  const { data, error } = await supabase
    .from('articles')
    .update({ content })
    .eq('slug', 'api-key-leaked-emergency-response')
    .select()

  if (error) {
    console.error('更新失败:', error.message)
    return
  }

  console.log('✅ 文章已更新，配图已添加！')
  console.log(`   文章 ID: ${data[0].id}`)
  console.log(`   已添加 5 张配图`)
  console.log(`   访问地址: https://www.apixuan.com/guide/${data[0].slug}`)
}

updateArticleWithImages()
