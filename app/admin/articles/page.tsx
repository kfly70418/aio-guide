import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils'
import { ArticlesClient } from './ArticlesClient'

const CATEGORY_LABEL: Record<string, string> = {
  tutorial: '教程',
  guide: '指南',
  news: '资讯',
  faq: '常见问题',
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''
  const pageSize = 20

  const supabase = await createClient()

  // 构建查询
  let query = supabase
    .from('articles')
    .select('*, provider:providers(name)', { count: 'exact' })

  // 搜索过滤
  if (search) {
    query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`)
  }

  // 分页
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: articles, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPages = count ? Math.ceil(count / pageSize) : 0

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">文章管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            共 {count || 0} 篇文章
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          新增文章
        </Link>
      </div>

      <ArticlesClient
        articles={articles || []}
        categoryLabel={CATEGORY_LABEL}
        currentPage={page}
        totalPages={totalPages}
        initialSearch={search}
      />
    </div>
  )
}
