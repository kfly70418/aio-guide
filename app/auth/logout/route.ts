import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function signOutAndRedirect(request: Request) {
  const supabase = await createClient()

  await supabase.auth.signOut()

  // 允许调用方带上 ?error= 说明登出原因，登录页会展示出来。
  // Server Component 无法写 cookie，因此后台布局发现权限异常时
  // 只能重定向到这里来完成登出，否则会话残留会导致登录页与
  // /admin 之间来回跳转。
  const reason = new URL(request.url).searchParams.get('error')
  const target = new URL('/auth/login', request.url)
  if (reason) {
    target.searchParams.set('error', reason)
  }

  return NextResponse.redirect(target)
}

export async function POST(request: Request) {
  return signOutAndRedirect(request)
}

export async function GET(request: Request) {
  return signOutAndRedirect(request)
}
