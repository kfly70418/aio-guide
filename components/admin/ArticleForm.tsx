'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Article } from '@/lib/types'

interface ProviderOption {
  id: string
  name: string
}

interface ArticleFormProps {
  mode: 'create' | 'edit'
  article?: Article
  providers: ProviderOption[]
}

export default function ArticleForm({ mode, article, providers }: ArticleFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inputClass =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const tagsRaw = (formData.get('tags') as string) || ''

    const payload = {
      slug: formData.get('slug') as string,
      title: formData.get('title') as string,
      summary: (formData.get('summary') as string) || null,
      content: formData.get('content') as string,
      cover_image_url: (formData.get('cover_image_url') as string) || null,
      related_provider_id: (formData.get('related_provider_id') as string) || null,
      category: formData.get('category') as string,
      tags: tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      status: formData.get('status') as string,
      sort_order: Number(formData.get('sort_order')) || 0,
    }

    try {
      const url =
        mode === 'create'
          ? '/admin/articles/api'
          : `/admin/articles/api?id=${article?.id}`

      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || '操作失败')

      router.push('/admin/articles')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`确定要删除文章「${article?.title}」吗？`)) return
    if (!confirm('再次确认：删除后无法恢复。继续？')) return

    setLoading(true)
    try {
      const res = await fetch(`/admin/articles/api?id=${article?.id}`, {
        method: 'DELETE',
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || '删除失败')
      router.push('/admin/articles')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
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
        <label className="block text-sm font-medium text-gray-700">标题 *</label>
        <input
          type="text"
          name="title"
          required
          defaultValue={article?.title}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          URL Slug * (仅小写字母、数字、短横线)
        </label>
        <input
          type="text"
          name="slug"
          required
          pattern="[a-z0-9-]+"
          defaultValue={article?.slug}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">摘要</label>
        <textarea
          name="summary"
          rows={2}
          defaultValue={article?.summary || ''}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          正文 * (支持 Markdown)
        </label>
        <textarea
          name="content"
          rows={16}
          required
          defaultValue={article?.content}
          className={`${inputClass} font-mono text-sm`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">分类 *</label>
          <select
            name="category"
            defaultValue={article?.category || 'tutorial'}
            className={inputClass}
          >
            <option value="tutorial">教程</option>
            <option value="guide">指南</option>
            <option value="news">资讯</option>
            <option value="faq">常见问题</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">关联服务商</label>
          <select
            name="related_provider_id"
            defaultValue={article?.related_provider_id || ''}
            className={inputClass}
          >
            <option value="">不关联</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">标签 (逗号分隔)</label>
        <input
          type="text"
          name="tags"
          defaultValue={article?.tags?.join(', ') || ''}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">封面图 URL</label>
        <input
          type="url"
          name="cover_image_url"
          defaultValue={article?.cover_image_url || ''}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">状态 *</label>
          <select
            name="status"
            defaultValue={article?.status || 'draft'}
            className={inputClass}
          >
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="archived">已归档</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">排序权重</label>
          <input
            type="number"
            name="sort_order"
            defaultValue={article?.sort_order || 0}
            className={inputClass}
          />
        </div>
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
