import { NextResponse } from 'next/server'
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
      .from('channels')
      .insert({ ...body, created_by: user.id, updated_by: user.id })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await logAction({
      action: 'create_channel',
      resourceType: 'channel',
      resourceId: data.id,
      details: { name: data.name, provider_id: data.provider_id },
    })

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

    const { data, error } = await supabase
      .from('channels')
      .update({ ...body, updated_by: user.id })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await logAction({
      action: 'update_channel',
      resourceType: 'channel',
      resourceId: data.id,
      details: { name: data.name },
    })

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

    const { data: channel } = await supabase
      .from('channels')
      .select('name, provider_id')
      .eq('id', id)
      .single()

    const { error } = await supabase.from('channels').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await logAction({
      action: 'delete_channel',
      resourceType: 'channel',
      resourceId: id,
      details: channel ?? undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
