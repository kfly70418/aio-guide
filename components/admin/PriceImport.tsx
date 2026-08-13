'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PreviewRow {
  line: number
  provider_slug: string
  channel_name: string
  model_slug: string
  price_input: number
  price_output: number
  rate: number | null
  currency: string
  effective_date: string
  status: string
  action: string
}

interface RowError {
  line: number
  message: string
}

export default function PriceImport() {
  const router = useRouter()
  const [csv, setCsv] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState<PreviewRow[] | null>(null)
  const [errors, setErrors] = useState<RowError[]>([])
  const [result, setResult] = useState<string>('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setCsv(text)
    setRows(null)
    setErrors([])
    setResult('')
  }

  const runPreview = async () => {
    setLoading(true)
    setError('')
    setResult('')
    try {
      const res = await fetch('/admin/prices/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv, commit: false }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || '预览失败')
      setRows(body.rows)
      setErrors(body.errors)
    } catch (err) {
      setError(err instanceof Error ? err.message : '预览失败')
    } finally {
      setLoading(false)
    }
  }

  const runCommit = async () => {
    if (!confirm(`确认导入 ${rows?.length ?? 0} 行价格数据？已存在的组合会被覆盖。`)) {
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/admin/prices/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv, commit: true }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || '导入失败')
      setResult(`导入完成：成功 ${body.imported} 行，跳过 ${body.skipped} 行。`)
      setRows(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded text-sm">
        <p className="font-medium mb-1">CSV 列格式</p>
        <code className="block bg-white p-2 rounded text-xs overflow-x-auto">
          provider_slug,channel_name,model_slug,price_input,price_output,rate,currency,effective_date,status,notes
        </code>
        <p className="mt-2">
          前五列必填。渠道按「服务商 slug + 渠道名」匹配，模型按 slug 匹配，匹配不到的行会在预览里报错并跳过。
          已存在的「渠道 + 模型」组合会被更新，并自动写入价格历史。
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          {result}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择 CSV 文件
        </label>
        <input type="file" accept=".csv,text/csv" onChange={handleFile} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          或直接粘贴 CSV 内容
        </label>
        <textarea
          value={csv}
          onChange={(e) => {
            setCsv(e.target.value)
            setRows(null)
          }}
          rows={8}
          className="block w-full rounded-md border-gray-300 shadow-sm font-mono text-xs focus:border-blue-500 focus:ring-blue-500"
          placeholder="provider_slug,channel_name,model_slug,price_input,price_output,rate,currency,effective_date,status,notes"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={runPreview}
          disabled={loading || csv.trim() === ''}
          className="bg-gray-700 text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? '处理中...' : '预览校验'}
        </button>

        {rows && rows.length > 0 && (
          <button
            type="button"
            onClick={runCommit}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            确认导入 {rows.length} 行
          </button>
        )}
      </div>

      {errors.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-red-700 mb-2">
            错误行（{errors.length}）
          </h2>
          <ul className="space-y-1 text-sm">
            {errors.map((e, i) => (
              <li key={i} className="bg-red-50 border border-red-200 px-3 py-2 rounded">
                第 {e.line} 行：{e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rows && (
        <div>
          <h2 className="text-lg font-semibold mb-2">
            将要导入（{rows.length}）
          </h2>
          {rows.length === 0 ? (
            <p className="text-gray-500 text-sm">没有可导入的有效行。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">行</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">操作</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">服务商</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">渠道</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">模型</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">输入价</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">输出价</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">倍率</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map((r) => (
                    <tr key={r.line}>
                      <td className="px-3 py-2">{r.line}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            r.action === '新增'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {r.action}
                        </span>
                      </td>
                      <td className="px-3 py-2">{r.provider_slug}</td>
                      <td className="px-3 py-2">{r.channel_name}</td>
                      <td className="px-3 py-2">{r.model_slug}</td>
                      <td className="px-3 py-2">{r.price_input}</td>
                      <td className="px-3 py-2">{r.price_output}</td>
                      <td className="px-3 py-2">{r.rate ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
