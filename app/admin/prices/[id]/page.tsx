import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PriceForm from '@/components/admin/PriceForm'
import { getChannelOptions, getModelOptions } from '@/lib/adminData'
import { formatDateTime, formatPrice } from '@/lib/utils'

export default async function EditPricePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: price }, channels, models] = await Promise.all([
    supabase.from('prices').select('*').eq('id', id).single(),
    getChannelOptions(),
    getModelOptions(),
  ])

  if (!price) {
    notFound()
  }

  const { data: history } = await supabase
    .from('price_history')
    .select('*')
    .eq('price_id', id)
    .order('changed_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">编辑价格</h1>

      <PriceForm
        mode="edit"
        price={{
          id: price.id,
          channel_id: price.channel_id,
          model_id: price.model_id,
          price_input: Number(price.price_input),
          price_output: Number(price.price_output),
          rate: price.rate != null ? Number(price.rate) : null,
          currency: price.currency,
          effective_date: price.effective_date,
          notes: price.notes,
          verified_at: price.verified_at,
          status: price.status,
        }}
        channels={channels}
        models={models}
      />

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-4">价格变更历史</h2>

        {history && history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">输入价</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">输出价</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">倍率</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatDateTime(h.changed_at)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {h.change_type === 'created' ? '创建' : h.change_type === 'updated' ? '修改' : '删除'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {h.price_input_old != null && (
                        <span className="text-gray-400 line-through mr-2">
                          {formatPrice(Number(h.price_input_old), h.currency)}
                        </span>
                      )}
                      {formatPrice(Number(h.price_input_new), h.currency)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {h.price_output_old != null && (
                        <span className="text-gray-400 line-through mr-2">
                          {formatPrice(Number(h.price_output_old), h.currency)}
                        </span>
                      )}
                      {formatPrice(Number(h.price_output_new), h.currency)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {h.rate_old != null && (
                        <span className="text-gray-400 line-through mr-2">
                          {Number(h.rate_old)}x
                        </span>
                      )}
                      {h.rate_new != null ? `${Number(h.rate_new)}x` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">暂无变更记录。</p>
        )}
      </div>
    </div>
  )
}
