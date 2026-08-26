import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAction } from '@/lib/auditLog'
import { notifyIndexNow } from '@/lib/indexnow'

function refreshProviderPages(slug?: string) {
  revalidatePath('/')
  revalidatePath('/providers')
  revalidatePath('/sitemap.xml')
  if (slug) {
    revalidatePath(`/providers/${slug}`)
  }
}

// 创建服务商
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('providers')
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

    // 记录操作日志
    await logAction({
      action: 'create_provider',
      resourceType: 'provider',
      resourceId: data.id,
      details: { name: data.name, status: data.status },
    })

    refreshProviderPages(data.slug)
    if (data.status === 'published') {
      await notifyIndexNow(['/', '/providers', `/providers/${data.slug}`])
    }

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// 更新服务商
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
      .from('providers')
      .select('status, slug')
      .eq('id', id)
      .single()

    const { data, error } = await supabase
      .from('providers')
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

    // 记录操作日志
    await logAction({
      action: 'update_provider',
      resourceType: 'provider',
      resourceId: data.id,
      details: {
        name: data.name,
        status_before: before?.status,
        status_after: data.status,
      },
    })

    refreshProviderPages(data.slug)
    if (before?.slug && before.slug !== data.slug) {
      revalidatePath(`/providers/${before.slug}`)
    }
    if (before?.status === 'published' || data.status === 'published') {
      await notifyIndexNow([
        '/',
        '/providers',
        `/providers/${data.slug}`,
        ...(before?.slug && before.slug !== data.slug ? [`/providers/${before.slug}`] : []),
      ])
    }

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// 删除服务商
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

    // 获取服务商信息用于日志
    const { data: provider } = await supabase
      .from('providers')
      .select('name, slug')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('providers')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // 记录操作日志
    await logAction({
      action: 'delete_provider',
      resourceType: 'provider',
      resourceId: id,
      details: { name: provider?.name },
    })

    refreshProviderPages(provider?.slug)
    if (provider?.slug) {
      await notifyIndexNow(['/', '/providers', `/providers/${provider.slug}`])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// 标记核验
export async function PATCH(request: Request) {
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

    const { data, error } = await supabase
      .from('providers')
      .update({
        verified_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // 记录操作日志
    await logAction({
      action: 'verify_provider',
      resourceType: 'provider',
      resourceId: data.id,
      details: { name: data.name, verified_at: data.verified_at },
    })

    refreshProviderPages(data.slug)
    if (data.status === 'published') {
      await notifyIndexNow(['/', '/providers', `/providers/${data.slug}`])
    }

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
