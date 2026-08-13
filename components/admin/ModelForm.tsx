'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Model } from '@/lib/types'

interface ModelFormProps {
  model?: Model
  mode: 'create' | 'edit'
}

export default function ModelForm({ model, mode }: ModelFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      slug: formData.get('slug') as string,
      name: formData.get('name') as string,
      family: formData.get('family') as string,
      provider_official: formData.get('provider_official') as string || null,
      description: formData.get('description') as string || null,
      official_price_input: parseFloat(formData.get('official_price_input') as string) || null,
      official_price_output: parseFloat(formData.get('official_price_output') as string) || null,
      status: formData.get('status') as string,
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
    }

    try {
      const url = mode === 'create'
        ? '/admin/models/api'
        : `/admin/models/api?id=${model?.id}`

      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || '操作失败')
      }

      router.push('/admin/models')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个模型吗？此操作不可恢复。')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/admin/models/api?id=${model?.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('删除失败')
      }

      router.push('/admin/models')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
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

      <div>
        <label className="block text-sm font-medium text-gray-700">
          模型名称 *
        </label>
        <input
          type="text"
          name="name"
          required
          defaultValue={model?.name}
          placeholder="例如: gpt-4-turbo"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          URL Slug *
        </label>
        <input
          type="text"
          name="slug"
          required
          pattern="[a-z0-9-]+"
          defaultValue={model?.slug}
          placeholder="例如: gpt-4-turbo"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          模型家族 *
        </label>
        <input
          type="text"
          name="family"
          required
          defaultValue={model?.family}
          placeholder="例如: GPT-4, Claude 3"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          官方提供商
        </label>
        <input
          type="text"
          name="provider_official"
          defaultValue={model?.provider_official || ''}
          placeholder="例如: OpenAI, Anthropic"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          模型简介
        </label>
        <textarea
          name="description"
          rows={3}
          defaultValue={model?.description || ''}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            官方输入价格 (美元/百万token)
          </label>
          <input
            type="number"
            name="official_price_input"
            step="0.0001"
            defaultValue={model?.official_price_input || ''}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            官方输出价格 (美元/百万token)
          </label>
          <input
            type="number"
            name="official_price_output"
            step="0.0001"
            defaultValue={model?.official_price_output || ''}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          状态 *
        </label>
        <select
          name="status"
          defaultValue={model?.status || 'published'}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="archived">已归档</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          排序权重
        </label>
        <input
          type="number"
          name="sort_order"
          defaultValue={model?.sort_order || 0}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '保存中...' : mode === 'create' ? '创建' : '保存'}
        </button>

        {mode === 'edit' && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            删除
          </button>
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
