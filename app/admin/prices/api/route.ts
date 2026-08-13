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
      .from('prices')
      .insert({
        ...body,
        verified_at: new Date().toISOString(),
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await logAction({
      action: 'create_price',
      resourceType: 'price',
      resourceId: data.id,
      details: {
        price_input: data.price_input,
        price_output: data.price_output,
        rate: data.rate,
      },
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

    const { data: before } = await supabase
      .from('prices')
      .select('price_input, price_output, rate')
      .eq('id', id)
      .single()

    const { data, error } = await supabase
      .from('prices')
      .update({ ...body, updated_by: user.id })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await logAction({
      action: 'update_price',
      resourceType: 'price',
      resourceId: data.id,
      details: {
        before,
        after: {
          price_input: data.price_input,
          price_output: data.price_output,
          rate: data.rate,
        },
      },
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

    const { data: price } = await supabase
      .from('prices')
      .select('price_input, price_output, channel_id, model_id')
      .eq('id', id)
      .single()

    const { error } = await supabase.from('prices').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await logAction({
      action: 'delete_price',
      resourceType: 'price',
      resourceId: id,
      details: price ?? undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
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

    const { data, error } = await supabase
      .from('prices')
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

    await logAction({
      action: 'verify_price',
      resourceType: 'price',
      resourceId: data.id,
      details: { verified_at: data.verified_at },
    })

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
