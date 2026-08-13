import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAction } from '@/lib/auditLog'

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

    revalidatePath('/articles')
    revalidatePath(`/articles/${data.slug}`)

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
      .select('status, published_at, slug')
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

    revalidatePath('/articles')
    revalidatePath(`/articles/${data.slug}`)
    if (before?.slug && before.slug !== data.slug) {
      revalidatePath(`/articles/${before.slug}`)
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

    revalidatePath('/articles')
    if (article?.slug) {
      revalidatePath(`/articles/${article.slug}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
