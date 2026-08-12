import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/admin'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 登录成功，重定向到目标页面
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // 登录失败，重定向到登录页并显示错误
  return NextResponse.redirect(
    new URL('/auth/login?error=' + encodeURIComponent('登录验证失败，请重试'), request.url)
  )
}
