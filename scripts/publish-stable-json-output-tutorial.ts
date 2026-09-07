import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) throw new Error('缺少 Supabase 环境变量')

const supabase = createClient(supabaseUrl, serviceRoleKey)
const slug = 'stable-json-output-ai-api'
const now = new Date().toISOString()

const article = {
  slug,
  title: '如何让 AI API 稳定返回 JSON：结构化输出、Schema 与解析失败处理（2026）',
  summary: '从 JSON mode、JSON Schema 到客户端校验，讲清楚如何让 AI API 稳定返回可解析的数据，并附 Python、Node.js 示例以及流式响应和失败重试策略。',
  content: fs.readFileSync(path.join(__dirname, '../upgraded-articles/stable-json-output-ai-api.md'), 'utf8'),
  category: 'tutorial' as const,
  tags: ['AI API', 'JSON', 'Structured Outputs', 'JSON Schema', 'Python', 'Node.js'],
  sort_order: 0,
}

const russian = {
  title: 'Как добиться стабильного JSON-ответа от AI API: структурированный вывод, Schema и обработка ошибок (2026)',
  summary: 'JSON mode, JSON Schema и проверка на стороне клиента: практическая инструкция со snippets для Python и Node.js, обработкой SSE, повторными запросами и защитой от невалидных ответов.',
  content: fs.readFileSync(path.join(__dirname, '../translations/stable-json-output-ai-api-ru.md'), 'utf8'),
}

async function publish() {
  const { data: existing, error: lookupError } = await supabase
    .from('articles')
    .select('id, published_at')
    .eq('slug', slug)
    .maybeSingle()
  if (lookupError) throw lookupError

  let articleId: string
  if (existing) {
    const { error } = await supabase.from('articles').update(article).eq('id', existing.id)
    if (error) throw error
    articleId = existing.id
  } else {
    const { data, error } = await supabase
      .from('articles')
      .insert({ ...article, status: 'draft', published_at: null })
      .select('id')
      .single()
    if (error || !data) throw error ?? new Error('创建文章失败')
    articleId = data.id
  }

  const translationRows = Object.entries(russian).map(([field, value]) => ({
    resource_type: 'article', resource_id: articleId, locale: 'ru', field, value,
  }))
  const { error: translationError } = await supabase.from('translations').upsert(translationRows, {
    onConflict: 'resource_type,resource_id,locale,field',
  })
  if (translationError) throw translationError

  const { error: publishError } = await supabase.from('articles').update({
    status: 'published', published_at: existing?.published_at ?? now,
  }).eq('id', articleId)
  if (publishError) throw publishError

  const { data: fields, error: verifyError } = await supabase
    .from('translations').select('field').eq('resource_type', 'article').eq('resource_id', articleId).eq('locale', 'ru')
  if (verifyError) throw verifyError
  const fieldSet = new Set(fields?.map(item => item.field))
  if (!['title', 'summary', 'content'].every(field => fieldSet.has(field))) throw new Error('俄语翻译字段不完整')

  console.log(`已发布双语教程：${slug}`)
  console.log(`中文：https://www.apixuan.com/articles/${slug}`)
  console.log(`俄文：https://www.apixuan.com/ru/articles/${slug}`)
}

publish().catch(error => { console.error('发布失败：', error); process.exit(1) })
