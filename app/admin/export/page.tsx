import { createClient } from '@/lib/supabase/server'

const TABLES = [
  { key: 'providers', label: '服务商' },
  { key: 'models', label: '模型' },
  { key: 'channels', label: '渠道' },
  { key: 'prices', label: '当前报价' },
  { key: 'price_history', label: '价格历史' },
  { key: 'articles', label: '文章' },
  { key: 'click_events', label: '外链点击' },
  { key: 'audit_logs', label: '操作日志' },
  { key: 'profiles', label: '管理员资料' },
] as const

export default async function ExportPage() {
  const supabase = await createClient()

  const counts = await Promise.all(
    TABLES.map(async (t) => {
      const { count } = await supabase
        .from(t.key)
        .select('*', { count: 'exact', head: true })
      return { ...t, count: count ?? 0 }
    })
  )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">数据导出</h1>
      <p className="text-gray-600 mb-6">
        免费版数据库没有自动备份保障，建议定期手动导出一份留档。导出动作会写入操作日志。
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {counts.map((t) => (
          <div key={t.key} className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">{t.label}</div>
            <div className="text-2xl font-bold text-gray-900">{t.count}</div>
            <div className="text-xs text-gray-400 mt-1">{t.key}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold mb-1">JSON 单文件</h2>
          <p className="text-sm text-gray-600 mb-3">
            全部表打包成一个 JSON，结构完整、字段类型保留，适合程序化恢复。
          </p>
          <a
            href="/admin/export/api?format=json"
            className="inline-block bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
          >
            下载 JSON
          </a>
        </div>

        <div className="border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold mb-1">CSV 压缩包</h2>
          <p className="text-sm text-gray-600 mb-3">
            每张表一个 CSV，打包成 ZIP，带 UTF-8 BOM，可直接用 Excel 打开查看。
          </p>
          <a
            href="/admin/export/api?format=csv"
            className="inline-block bg-gray-700 text-white px-5 py-2 rounded hover:bg-gray-800"
          >
            下载 ZIP
          </a>
        </div>
      </div>
    </div>
  )
}
