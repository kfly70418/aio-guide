import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale') || 'ru'
  const category = searchParams.get('category') || 'tutorial'

  try {
    // 使用环境变量创建客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 步骤 1: 查询文章
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, slug, title, summary, category, published_at, view_count')
      .eq('status', 'published')
      .eq('category', category)
      .order('published_at', { ascending: false })
      .limit(50)

    if (articlesError) {
      return NextResponse.json({
        success: false,
        step: 1,
        error: articlesError,
        message: '查询文章失败'
      }, { status: 500 })
    }

    // 步骤 2: 查询翻译
    if (!articles || articles.length === 0) {
      return NextResponse.json({
        success: false,
        step: 1,
        message: '没有找到文章',
        articlesCount: 0
      })
    }

    const articleIds = articles.map(a => a.id)

    const { data: translations, error: transError } = await supabase
      .from('translations')
      .select('resource_id, field, value')
      .eq('resource_type', 'article')
      .in('resource_id', articleIds)
      .eq('locale', locale)

    if (transError) {
      return NextResponse.json({
        success: false,
        step: 2,
        error: transError,
        message: '查询翻译失败',
        articlesCount: articles.length
      }, { status: 500 })
    }

    // 步骤 3: 分组翻译
    const translationsMap = new Map<string, Record<string, string>>()
    translations?.forEach((t: any) => {
      if (!translationsMap.has(t.resource_id)) {
        translationsMap.set(t.resource_id, {})
      }
      translationsMap.get(t.resource_id)![t.field] = t.value
    })

    // 步骤 4: 过滤
    const filtered = articles.filter(article => {
      const trans = translationsMap.get(article.id)
      return trans && trans.title
    })

    // 步骤 5: 映射
    const result = filtered.map(article => {
      const trans = translationsMap.get(article.id)!
      return {
        id: article.id,
        slug: article.slug,
        title: trans.title || article.title,
        summary: trans.summary || article.summary,
        category: article.category,
        published_at: article.published_at
      }
    })

    return NextResponse.json({
      success: true,
      debug: {
        locale,
        category,
        env: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        },
        articlesCount: articles.length,
        translationsCount: translations?.length || 0,
        translatedArticlesCount: translationsMap.size,
        filteredCount: filtered.length,
        resultCount: result.length
      },
      articles: result
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
