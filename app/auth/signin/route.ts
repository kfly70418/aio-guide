import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function loginRedirect(request: Request, message: string) {
  return NextResponse.redirect(
    new URL('/auth/login?error=' + encodeURIComponent(message), request.url)
  )
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return loginRedirect(request, '请填写邮箱和密码')
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return loginRedirect(request, '邮箱或密码不正确')
  }

  // 密码已验证通过。以下校验管理员资格，任何失败都必须先登出，
  // 否则 /auth/login 会因为检测到有效会话而把用户弹回 /admin，形成循环。
  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('id', data.user.id)
    .maybeSingle()

  // 查询本身失败（RLS 策略错误、连接问题、迁移未跑等）。
  // 这与"账号没有权限"是完全不同的故障，必须分开报，否则会把
  // 配置问题误导成凭据问题。
  if (profileError) {
    console.error('[auth/signin] 读取 profiles 失败', {
      userId: data.user.id,
      code: profileError.code,
      message: profileError.message,
      details: profileError.details,
    })
    await supabase.auth.signOut()
    return loginRedirect(
      request,
      `登录校验失败：数据库返回错误 ${profileError.code ?? '未知'}。密码已验证通过，请检查服务端日志与数据库配置。`
    )
  }

  // 查询成功但查无此人：该 auth 用户没有对应的 profiles 记录
  if (!profile) {
    await supabase.auth.signOut()
    return loginRedirect(request, '该账号不是管理员，无法访问后台')
  }

  // 有记录但被停用
  if (!profile.is_active) {
    await supabase.auth.signOut()
    return loginRedirect(request, '该账号已被停用，请联系超级管理员')
  }

  return NextResponse.redirect(new URL('/admin', request.url))
}
