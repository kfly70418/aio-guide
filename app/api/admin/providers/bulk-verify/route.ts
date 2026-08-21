import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { ids, verification_status, verified_at } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('providers')
      .update({
        verification_status,
        verified_at: verified_at ?? null,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)

    if (error) throw error

    return NextResponse.json({ success: true, count: ids.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
