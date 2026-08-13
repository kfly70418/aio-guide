'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ChannelOption {
  id: string
  name: string
  provider_name: string
}

interface ModelOption {
  id: string
  name: string
  family: string
}

interface PriceRecord {
  id: string
  channel_id: string
  model_id: string
  price_input: number
  price_output: number
  rate: number | null
  currency: string
  effective_date: string
  notes: string | null
  verified_at: string | null
  status: string
}

interface PriceFormProps {
  mode: 'create' | 'edit'
  price?: PriceRecord
  channels: ChannelOption[]
  models: ModelOption[]
}

export default function PriceForm({ mode, price, channels, models }: PriceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const rateRaw = formData.get('rate') as string

    const payload = {
      channel_id: formData.get('channel_id') as string,
      model_id: formData.get('model_id') as string,
      price_input: Number(formData.get('price_input')),
      price_output: Number(formData.get('price_output')),
      rate: rateRaw ? Number(rateRaw) : null,
      currency: formData.get('currency') as string,
      effective_date: formData.get('effective_date') as string,
      notes: (formData.get('notes') as string) || null,
      status: formData.get('status') as string,
    }

    try {
      const url =
        mode === 'create' ? '/admin/prices/api' : `/admin/prices/api?id=${price?.id}`

      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const body = await res.json()
      if (!res.ok) {
        throw new Error(body.error || '操作失败')
      }

      router.push('/admin/prices')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这条价格记录吗？此操作不可恢复。')) return
    if (!confirm('再次确认：删除后价格历史仍会保留，但当前报价会消失。继续？')) return

    setLoading(true)
    try {
      const res = await fetch(`/admin/prices/api?id=${price?.id}`, { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || '删除失败')
      router.push('/admin/prices')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/admin/prices/api?id=${price?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || '核验失败')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '核验失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {channels.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          还没有任何渠道。请先到服务商页面为服务商添加渠道，再来录入价格。
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">渠道 *</label>
        <select
          name="channel_id"
          required
          defaultValue={price?.channel_id || ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">请选择渠道</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              {c.provider_name} / {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">模型 *</label>
        <select
          name="model_id"
          required
          defaultValue={price?.model_id || ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">请选择模型</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.family} / {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            输入价 * (每百万 token)
          </label>
          <input
            type="number"
            name="price_input"
            step="0.0001"
            min="0"
            required
            defaultValue={price?.price_input ?? ''}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            输出价 * (每百万 token)
          </label>
          <input
            type="number"
            name="price_output"
            step="0.0001"
            min="0"
            required
            defaultValue={price?.price_output ?? ''}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">倍率</label>
          <input
            type="number"
            name="rate"
            step="0.0001"
            min="0"
            placeholder="例如 0.5 表示官方五折"
            defaultValue={price?.rate ?? ''}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">币种 *</label>
          <select
            name="currency"
            defaultValue={price?.currency || 'CNY'}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="CNY">人民币 CNY</option>
            <option value="USD">美元 USD</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">生效日期 *</label>
          <input
            type="date"
            name="effective_date"
            required
            defaultValue={price?.effective_date || new Date().toISOString().slice(0, 10)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">状态 *</label>
          <select
            name="status"
            defaultValue={price?.status || 'active'}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="active">活跃</option>
            <option value="inactive">已停用</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">备注</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={price?.notes || ''}
          placeholder="例如：首充 100 送 20，限时活动"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {mode === 'edit' && (
        <div className="bg-gray-50 p-4 rounded text-sm text-gray-700">
          最后人工核验：
          {price?.verified_at
            ? new Date(price.verified_at).toLocaleString('zh-CN')
            : '尚未核验'}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <button
          type="submit"
          disabled={loading || channels.length === 0}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '保存中...' : mode === 'create' ? '创建' : '保存'}
        </button>

        {mode === 'edit' && (
          <>
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              标记已核验
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              删除
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
        >
          取消
        </button>
      </div>
    </form>
  )
}
