import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils'

const ACTION_LABEL: Record<string, string> = {
  create_provider: '新增服务商',
  update_provider: '修改服务商',
  delete_provider: '删除服务商',
  verify_provider: '核验服务商',
  create_model: '新增模型',
  update_model: '修改模型',
  delete_model: '删除模型',
  create_channel: '新增渠道',
  update_channel: '修改渠道',
  delete_channel: '删除渠道',
  create_price: '新增价格',
  update_price: '修改价格',
  delete_price: '删除价格',
  verify_price: '核验价格',
  import_prices_csv: 'CSV 导入价格',
  export_prices_csv: 'CSV 导出价格',
  create_article: '新增文章',
  update_article: '修改文章',
  delete_article: '删除文章',
  export_backup: '导出数据备份',
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const currentPage = Math.max(1, Number(page) || 1)
  const pageSize = 50
  const from = (currentPage - 1) * pageSize

  const supabase = await createClient()

  const { data: logs, count } = await supabase
    .from('audit_logs')
    .select('*, profile:profiles(email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">操作日志</h1>
      <p className="text-sm text-gray-600 mb-4">共 {count ?? 0} 条记录</p>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作人</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">动作</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">对象</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">详情</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs?.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDateTime(log.created_at)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {log.profile?.email ?? log.user_id}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {ACTION_LABEL[log.action] ?? log.action}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                  {log.resource_type}
                </td>
                <td className="px-4 py-3">
                  {log.details ? (
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap max-w-md">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!logs || logs.length === 0) && (
        <div className="text-center py-12 text-gray-500">暂无操作日志。</div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          {currentPage > 1 && (
            <a
              href={`/admin/logs?page=${currentPage - 1}`}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              上一页
            </a>
          )}
          <span className="px-4 py-2 text-gray-600">
            第 {currentPage} / {totalPages} 页
          </span>
          {currentPage < totalPages && (
            <a
              href={`/admin/logs?page=${currentPage + 1}`}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              下一页
            </a>
          )}
        </div>
      )}
    </div>
  )
}
