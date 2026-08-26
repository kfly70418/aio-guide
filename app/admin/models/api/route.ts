import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAction } from '@/lib/auditLog'
import { notifyIndexNow } from '@/lib/indexnow'

function refreshModelPages(slug?: string) {
  revalidatePath('/')
  revalidatePath('/models')
  revalidatePath('/sitemap.xml')
  if (slug) {
    revalidatePath(`/models/${slug}`)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('models')
      .insert({
        ...body,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await logAction({
      action: 'create_model',
      resourceType: 'model',
      resourceId: data.id,
      details: { name: data.name },
    })

    refreshModelPages(data.slug)
    if (data.status === 'published') {
      await notifyIndexNow(['/', '/models', `/models/${data.slug}`])
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
    const { data: { user } } = await supabase.auth.getUser()

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
      .from('models')
      .select('status, slug')
      .eq('id', id)
      .single()

    const { data, error } = await supabase
      .from('models')
      .update({
        ...body,
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await logAction({
      action: 'update_model',
      resourceType: 'model',
      resourceId: data.id,
      details: { name: data.name },
    })

    refreshModelPages(data.slug)
    if (before?.slug && before.slug !== data.slug) {
      revalidatePath(`/models/${before.slug}`)
    }
    if (before?.status === 'published' || data.status === 'published') {
      await notifyIndexNow([
        '/',
        '/models',
        `/models/${data.slug}`,
        ...(before?.slug && before.slug !== data.slug ? [`/models/${before.slug}`] : []),
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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少 ID' }, { status: 400 })
    }

    const { data: model } = await supabase
      .from('models')
      .select('name, slug')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('models')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await logAction({
      action: 'delete_model',
      resourceType: 'model',
      resourceId: id,
      details: { name: model?.name },
    })

    refreshModelPages(model?.slug)
    if (model?.slug) {
      await notifyIndexNow(['/', '/models', `/models/${model.slug}`])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
