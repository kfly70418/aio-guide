import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 未登录跳转到登录页
  if (!user) {
    redirect('/auth/login')
  }

  // 获取管理员资料。用 maybeSingle 而非 single：查无此人属于正常分支，
  // 不该和真正的查询错误混在一起。
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // 以下任何一种失败都必须经 /auth/logout 清掉会话再回登录页。
  // 直接 redirect('/auth/login') 会死循环：登录页看到会话有效就把人送回 /admin。
  // Server Component 里写不了 cookie，所以登出只能交给 Route Handler。
  if (profileError) {
    console.error('[admin/layout] 读取 profiles 失败', {
      userId: user.id,
      code: profileError.code,
      message: profileError.message,
      details: profileError.details,
    })
    redirect(
      '/auth/logout?error=' +
        encodeURIComponent(
          `后台校验失败：数据库返回错误 ${profileError.code ?? '未知'}。请检查服务端日志与数据库配置。`
        )
    )
  }

  if (!profile) {
    redirect(
      '/auth/logout?error=' + encodeURIComponent('该账号不是管理员，无法访问后台')
    )
  }

  if (!profile.is_active) {
    redirect(
      '/auth/logout?error=' + encodeURIComponent('该账号已被停用，请联系超级管理员')
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/admin" className="text-xl font-bold text-gray-900">
                  管理后台
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">{profile.email}</span>
              <form action="/auth/logout" method="POST">
                <button
                  type="submit"
                  className="text-gray-600 hover:text-gray-900"
                >
                  登出
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="flex gap-6">
            {/* 侧边栏 */}
            <aside className="w-64 flex-shrink-0">
              <nav className="bg-white shadow rounded-lg p-4">
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    >
                      概览
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/providers"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    >
                      服务商管理
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/models"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    >
                      模型管理
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/provider-models"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    >
                      服务商模型配置
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/prices"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    >
                      价格管理
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/articles"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    >
                      文章管理
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/export"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    >
                      数据导出
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/logs"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    >
                      操作日志
                    </Link>
                  </li>
                </ul>
              </nav>
            </aside>

            {/* 主内容区 */}
            <main className="flex-1">
              <div className="bg-white shadow rounded-lg p-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
