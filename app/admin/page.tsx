import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // 统计数据
  const [
    { count: providersCount },
    { count: modelsCount },
    { count: pricesCount },
    { count: articlesCount },
  ] = await Promise.all([
    supabase.from('providers').select('*', { count: 'exact', head: true }),
    supabase.from('models').select('*', { count: 'exact', head: true }),
    supabase.from('prices').select('*', { count: 'exact', head: true }),
    supabase.from('articles').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">管理后台概览</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="text-sm text-gray-600">服务商</div>
          <div className="text-3xl font-bold text-blue-600">{providersCount || 0}</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="text-sm text-gray-600">模型</div>
          <div className="text-3xl font-bold text-green-600">{modelsCount || 0}</div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="text-sm text-gray-600">价格记录</div>
          <div className="text-3xl font-bold text-purple-600">{pricesCount || 0}</div>
        </div>
        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="text-sm text-gray-600">文章</div>
          <div className="text-3xl font-bold text-orange-600">{articlesCount || 0}</div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/providers/new"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-center"
          >
            <div className="text-2xl mb-2">+</div>
            <div className="font-medium">新增服务商</div>
          </Link>
          <Link
            href="/admin/models/new"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 text-center"
          >
            <div className="text-2xl mb-2">+</div>
            <div className="font-medium">新增模型</div>
          </Link>
          <Link
            href="/admin/articles/new"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 text-center"
          >
            <div className="text-2xl mb-2">+</div>
            <div className="font-medium">新增文章</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
