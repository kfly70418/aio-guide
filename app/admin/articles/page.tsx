import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils'

const CATEGORY_LABEL: Record<string, string> = {
  tutorial: '教程',
  guide: '指南',
  news: '资讯',
  faq: '常见问题',
}

export default async function ArticlesPage() {
  const supabase = await createClient()

  const { data: articles } = await supabase
    .from('articles')
    .select('*, provider:providers(name)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link
          href="/admin/articles/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          新增文章
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">关联服务商</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">发布时间</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {articles?.map((article) => (
              <tr key={article.id}>
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-900">{article.title}</div>
                  <div className="text-sm text-gray-500">{article.slug}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {CATEGORY_LABEL[article.category] ?? article.category}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {article.provider?.name ?? '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      article.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : article.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {article.status === 'published'
                      ? '已发布'
                      : article.status === 'draft'
                      ? '草稿'
                      : '已归档'}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {article.published_at ? formatDateTime(article.published_at) : '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    编辑
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!articles || articles.length === 0) && (
        <div className="text-center py-12 text-gray-500">
          暂无文章，
          <Link href="/admin/articles/new" className="text-blue-600">
            点击新增
          </Link>
        </div>
      )}
    </div>
  )
}
