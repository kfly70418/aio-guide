import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('缺少 Supabase 环境变量')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)
const slug = 'openai-compatible-api-curl-python-nodejs'
const now = new Date().toISOString()

const article = {
  slug,
  title: 'OpenAI 兼容 API 调用教程：curl、Python、Node.js 三种方法（2026）',
  summary: '用 curl、PowerShell、Python 和 Node.js 调用 OpenAI 兼容 API，完整讲解 Base URL、API Key、Model ID、环境变量、安全设置与常见报错。',
  content: fs.readFileSync(
    path.join(__dirname, '../upgraded-articles/openai-compatible-api-curl-python-nodejs.md'),
    'utf8',
  ),
  category: 'tutorial' as const,
  tags: ['OpenAI兼容API', 'curl', 'Python', 'Node.js', 'API调用'],
  sort_order: 0,
}

const russian = {
  title: 'OpenAI API через curl, Python и Node.js: инструкция (2026)',
  summary: 'Первый вызов OpenAI-совместимого API через curl, PowerShell, Python и Node.js: Base URL, API Key, Model ID, переменные окружения, ошибки и безопасный запуск.',
  content: fs.readFileSync(
    path.join(__dirname, '../translations/openai-compatible-api-curl-python-nodejs-ru.md'),
    'utf8',
  ),
}

async function publishArticle() {
  const { data: existing, error: lookupError } = await supabase
    .from('articles')
    .select('id, published_at')
    .eq('slug', slug)
    .maybeSingle()

  if (lookupError) {
    throw lookupError
  }

  let articleId: string

  if (existing) {
    const { error } = await supabase
      .from('articles')
      .update(article)
      .eq('id', existing.id)

    if (error) {
      throw error
    }
    articleId = existing.id
  } else {
    const { data: created, error } = await supabase
      .from('articles')
      .insert({
        ...article,
        status: 'draft',
        published_at: null,
      })
      .select('id')
      .single()

    if (error || !created) {
      throw error ?? new Error('创建文章失败')
    }
    articleId = created.id
  }

  const translations = Object.entries(russian).map(([field, value]) => ({
    resource_type: 'article',
    resource_id: articleId,
    locale: 'ru',
    field,
    value,
  }))

  const { error: translationError } = await supabase
    .from('translations')
    .upsert(translations, {
      onConflict: 'resource_type,resource_id,locale,field',
    })

  if (translationError) {
    throw translationError
  }

  const { error: publishError } = await supabase
    .from('articles')
    .update({
      status: 'published',
      published_at: existing?.published_at ?? now,
    })
    .eq('id', articleId)

  if (publishError) {
    throw publishError
  }

  const { data: verification, error: verificationError } = await supabase
    .from('translations')
    .select('field')
    .eq('resource_type', 'article')
    .eq('resource_id', articleId)
    .eq('locale', 'ru')

  if (verificationError) {
    throw verificationError
  }

  const fields = new Set(verification?.map((item) => item.field))
  const hasCompleteRussianVersion = ['title', 'summary', 'content'].every((field) =>
    fields.has(field),
  )

  if (!hasCompleteRussianVersion) {
    throw new Error('俄文版本字段不完整')
  }

  console.log(`已发布双语教程：${slug}`)
  console.log(`文章 ID：${articleId}`)
  console.log('中文、俄文的标题、摘要和正文均已写入')
}

publishArticle().catch((error) => {
  console.error('发布失败：', error)
  process.exit(1)
})
