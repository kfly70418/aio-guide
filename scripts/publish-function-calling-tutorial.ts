import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) throw new Error('缺少 Supabase 环境变量')

const supabase = createClient(supabaseUrl, serviceRoleKey)
const slug = 'ai-api-function-calling-tools'
const now = new Date().toISOString()

const article = {
  slug,
  title: 'AI API Function Calling 工具调用教程：Schema、执行循环与安全校验（2026）',
  summary: '从工具 Schema、模型决策到服务端执行循环，完整讲解 AI API Function Calling 的实现方式、Python 和 Node.js 示例、参数校验与安全边界。',
  content: fs.readFileSync(path.join(__dirname, '../upgraded-articles/ai-api-function-calling-tools.md'), 'utf8'),
  category: 'tutorial' as const,
  tags: ['AI API', 'Function Calling', '工具调用', 'JSON Schema', 'Python', 'Node.js'],
  sort_order: 0,
}

const russian = {
  title: 'Function Calling в AI API: Schema, цикл выполнения и проверка безопасности (2026)',
  summary: 'Практическое руководство по Function Calling: Schema инструментов, цикл выполнения на сервере, примеры Python и Node.js, проверка аргументов и безопасные ограничения.',
  content: fs.readFileSync(path.join(__dirname, '../translations/ai-api-function-calling-tools-ru.md'), 'utf8'),
}

async function publish() {
  const { data: existing, error: lookupError } = await supabase
    .from('articles').select('id, published_at').eq('slug', slug).maybeSingle()
  if (lookupError) throw lookupError

  let articleId: string
  if (existing) {
    const { error } = await supabase.from('articles').update(article).eq('id', existing.id)
    if (error) throw error
    articleId = existing.id
  } else {
    const { data, error } = await supabase.from('articles')
      .insert({ ...article, status: 'draft', published_at: null })
      .select('id').single()
    if (error || !data) throw error ?? new Error('创建文章失败')
    articleId = data.id
  }

  const rows = Object.entries(russian).map(([field, value]) => ({
    resource_type: 'article', resource_id: articleId, locale: 'ru', field, value,
  }))
  const { error: translationError } = await supabase.from('translations').upsert(rows, {
    onConflict: 'resource_type,resource_id,locale,field',
  })
  if (translationError) throw translationError

  const { error: publishError } = await supabase.from('articles').update({
    status: 'published', published_at: existing?.published_at ?? now,
  }).eq('id', articleId)
  if (publishError) throw publishError

  const { data: fields, error: verifyError } = await supabase.from('translations')
    .select('field').eq('resource_type', 'article').eq('resource_id', articleId).eq('locale', 'ru')
  if (verifyError) throw verifyError
  const fieldSet = new Set(fields?.map(item => item.field))
  if (!['title', 'summary', 'content'].every(field => fieldSet.has(field))) throw new Error('俄语翻译字段不完整')

  console.log(`已发布双语教程：${slug}`)
  console.log(`中文：https://www.apixuan.com/articles/${slug}`)
  console.log(`俄文：https://www.apixuan.com/ru/articles/${slug}`)
}

publish().catch(error => { console.error('发布失败：', error); process.exit(1) })
