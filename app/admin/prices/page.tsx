import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDateTime, formatPrice, isExpired } from '@/lib/utils'

export default async function PricesPage() {
  const supabase = await createClient()

  const { data: prices } = await supabase
    .from('prices')
    .select(`
      *,
      channel:channels(id, name, provider:providers(id, name)),
      model:models(id, name)
    `)
    .order('created_at', { ascending: false })

  const expiredCount =
    prices?.filter((p) => isExpired(p.verified_at)).length ?? 0

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">价格管理</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/prices/import"
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            CSV 导入
          </Link>
          {/* 文件下载，必须用原生 a 触发浏览器下载，不能用 next/link */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/admin/prices/api/export"
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            CSV 导出
          </a>
          <Link
            href="/admin/prices/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            新增价格
          </Link>
        </div>
      </div>

      {expiredCount > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded">
          有 <strong>{expiredCount}</strong> 条价格超过 30 天未人工核验，建议尽快复核。
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">服务商</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">渠道</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">模型</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">输入价</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">输出价</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">倍率</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">核验时间</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prices?.map((price) => (
              <tr key={price.id}>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {price.channel?.provider?.name || '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {price.channel?.name || '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  {price.model?.name || '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {formatPrice(Number(price.price_input), price.currency)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {formatPrice(Number(price.price_output), price.currency)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {price.rate != null ? `${Number(price.rate)}x` : '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {price.verified_at ? (
                    <div className={isExpired(price.verified_at) ? 'text-red-600' : ''}>
                      {formatDateTime(price.verified_at)}
                      {isExpired(price.verified_at) && (
                        <div className="text-xs">已过期</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-red-600">未核验</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      price.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {price.status === 'active' ? '活跃' : '已停用'}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    href={`/admin/prices/${price.id}`}
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

      {(!prices || prices.length === 0) && (
        <div className="text-center py-12 text-gray-500">
          暂无价格记录，
          <Link href="/admin/prices/new" className="text-blue-600">
            点击新增
          </Link>
        </div>
      )}
    </div>
  )
}
