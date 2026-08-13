'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Channel {
  id: string
  name: string
  description: string | null
  is_primary: boolean
  priority: number
  status: string
}

interface ChannelManagerProps {
  providerId: string
  channels: Channel[]
}

export default function ChannelManager({ providerId, channels }: ChannelManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const submit = async (
    e: React.FormEvent<HTMLFormElement>,
    mode: 'create' | 'edit',
    id?: string
  ) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const payload = {
      provider_id: providerId,
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      is_primary: formData.get('is_primary') === 'on',
      priority: Number(formData.get('priority')) || 0,
      status: formData.get('status') as string,
    }

    try {
      const url =
        mode === 'create'
          ? '/admin/channels/api'
          : `/admin/channels/api?id=${id}`

      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || '操作失败')

      if (mode === 'create') {
        e.currentTarget.reset()
      } else {
        setEditingId(null)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: string, name: string) => {
    if (!confirm(`确定要删除渠道「${name}」吗？`)) return
    if (!confirm('再次确认：该渠道下的所有价格记录会一并删除。继续？')) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/admin/channels/api?id=${id}`, { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || '删除失败')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4">现有渠道（{channels.length}）</h2>

        {channels.length === 0 ? (
          <p className="text-gray-500 text-sm">
            还没有渠道。一个服务商可以有多个渠道（官方直连、备用线路等），价格挂在渠道下面。
          </p>
        ) : (
          <div className="space-y-3">
            {channels.map((c) => (
              <div key={c.id} className="border border-gray-200 rounded-lg p-4">
                {editingId === c.id ? (
                  <form onSubmit={(e) => submit(e, 'edit', c.id)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          渠道名 *
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          defaultValue={c.name}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          优先级
                        </label>
                        <input
                          type="number"
                          name="priority"
                          defaultValue={c.priority}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">说明</label>
                      <input
                        type="text"
                        name="description"
                        defaultValue={c.description || ''}
                        className={inputClass}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">状态</label>
                        <select name="status" defaultValue={c.status} className={inputClass}>
                          <option value="active">启用</option>
                          <option value="inactive">停用</option>
                        </select>
                      </div>
                      <label className="flex items-center mt-6">
                        <input
                          type="checkbox"
                          name="is_primary"
                          defaultChecked={c.is_primary}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">设为主渠道</span>
                      </label>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                      >
                        取消
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.name}</span>
                        {c.is_primary && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                            主渠道
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 text-xs rounded ${
                            c.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {c.status === 'active' ? '启用' : '停用'}
                        </span>
                      </div>
                      {c.description && (
                        <p className="text-sm text-gray-600 mt-1">{c.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">优先级 {c.priority}</p>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() => setEditingId(c.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(c.id, c.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold mb-4">添加渠道</h2>
        <form onSubmit={(e) => submit(e, 'create')} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">渠道名 *</label>
              <input
                type="text"
                name="name"
                required
                placeholder="例如：官方直连"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">优先级</label>
              <input type="number" name="priority" defaultValue={0} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">说明</label>
            <input type="text" name="description" className={inputClass} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">状态</label>
              <select name="status" defaultValue="active" className={inputClass}>
                <option value="active">启用</option>
                <option value="inactive">停用</option>
              </select>
            </div>
            <label className="flex items-center mt-6">
              <input
                type="checkbox"
                name="is_primary"
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">设为主渠道</span>
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '提交中...' : '添加渠道'}
          </button>
        </form>
      </section>
    </div>
  )
}
