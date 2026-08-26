import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAction } from '@/lib/auditLog'
import { notifyIndexNow } from '@/lib/indexnow'

function refreshArticlePages(slug?: string) {
  revalidatePath('/')
  revalidatePath('/articles')
  revalidatePath('/sitemap.xml')
  if (slug) {
    revalidatePath(`/articles/${slug}`)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('articles')
      .insert({
        ...body,
        published_at: body.status === 'published' ? new Date().toISOString() : null,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await logAction({
      action: 'create_article',
      resourceType: 'article',
      resourceId: data.id,
      details: { title: data.title, status: data.status },
    })

    refreshArticlePages(data.slug)
    if (data.status === 'published' && data.category !== 'news') {
      await notifyIndexNow(['/', '/articles', `/articles/${data.slug}`])
    }

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: '缺少 ID' }, { status: 400 })
    }

    const body = await request.json()

    const { data: before } = await supabase
      .from('articles')
      .select('status, category, published_at, slug')
      .eq('id', id)
      .single()

    // 首次发布时补上 published_at，之后不再覆盖
    let publishedAt = before?.published_at ?? null
    if (body.status === 'published' && !publishedAt) {
      publishedAt = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('articles')
      .update({
        ...body,
        published_at: publishedAt,
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await logAction({
      action: 'update_article',
      resourceType: 'article',
      resourceId: data.id,
      details: {
        title: data.title,
        status_before: before?.status,
        status_after: data.status,
      },
    })

    refreshArticlePages(data.slug)
    if (before?.slug && before.slug !== data.slug) {
      revalidatePath(`/articles/${before.slug}`)
    }

    const wasIndexable = before?.status === 'published' && before.category !== 'news'
    const isIndexable = data.status === 'published' && data.category !== 'news'
    if (wasIndexable || isIndexable) {
      await notifyIndexNow([
        '/',
        '/articles',
        `/articles/${data.slug}`,
        ...(before?.slug && before.slug !== data.slug ? [`/articles/${before.slug}`] : []),
      ])
    }

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: '缺少 ID' }, { status: 400 })
    }

    const { data: article } = await supabase
      .from('articles')
      .select('title, slug')
      .eq('id', id)
      .single()

    const { error } = await supabase.from('articles').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await logAction({
      action: 'delete_article',
      resourceType: 'article',
      resourceId: id,
      details: article ?? undefined,
    })

    refreshArticlePages(article?.slug)
    if (article?.slug) {
      await notifyIndexNow(['/', '/articles', `/articles/${article.slug}`])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
