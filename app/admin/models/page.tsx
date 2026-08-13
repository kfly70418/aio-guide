import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ModelsPage() {
  const supabase = await createClient()

  const { data: models } = await supabase
    .from('models')
    .select('*')
    .order('family', { ascending: true })
    .order('name', { ascending: true })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">模型管理</h1>
        <Link
          href="/admin/models/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          新增模型
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                模型名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                模型家族
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                官方提供商
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                官方价格
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {models?.map((model) => (
              <tr key={model.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{model.name}</div>
                  <div className="text-sm text-gray-500">{model.slug}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {model.family}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {model.provider_official || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {model.official_price_input && model.official_price_output ? (
                    <div>
                      <div>输入: ${model.official_price_input}</div>
                      <div>输出: ${model.official_price_output}</div>
                    </div>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      model.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {model.status === 'published' ? '已发布' : '草稿'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    href={`/admin/models/${model.id}`}
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

      {(!models || models.length === 0) && (
        <div className="text-center py-12 text-gray-500">
          暂无模型，<Link href="/admin/models/new" className="text-blue-600">点击新增</Link>
        </div>
      )}
    </div>
  )
}
