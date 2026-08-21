'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Provider } from '@/lib/types'
import { Button, Input, Textarea, Select, Checkbox, Card, ConfirmDialog } from '@/components/ui'
import type { SelectOption } from '@/components/ui'

interface ProviderFormProps {
  provider?: Provider
  mode: 'create' | 'edit'
}

export default function ProviderForm({ provider, mode }: ProviderFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const statusOptions: SelectOption[] = [
    { value: 'draft', label: '草稿' },
    { value: 'published', label: '已发布' },
    { value: 'archived', label: '已归档' },
  ]

  const verificationOptions: SelectOption[] = [
    { value: '', label: '未设置' },
    { value: 'verified', label: '通过检测' },
    { value: 'pending', label: '待检测' },
    { value: 'suspect', label: '存疑' },
    { value: 'failed', label: '未通过' },
  ]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      slug: formData.get('slug') as string,
      name: formData.get('name') as string,
      name_en: formData.get('name_en') as string || null,
      website_url: formData.get('website_url') as string || null,
      description: formData.get('description') as string || null,
      features: (formData.get('features') as string)?.split(',').map(f => f.trim()).filter(Boolean) || [],
      is_recommended: formData.get('is_recommended') === 'on',
      status: formData.get('status') as string,
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
      min_topup: formData.get('min_topup') as string || null,
      trial_credit: formData.get('trial_credit') as string || null,
      transaction_fee: formData.get('transaction_fee') as string || null,
      invoice_support: formData.get('invoice_support') === 'on',
      verification_status: formData.get('verification_status') as string || null,
    }

    try {
      const url = mode === 'create'
        ? '/admin/providers/api'
        : `/admin/providers/api?id=${provider?.id}`

      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || '操作失败')
      }

      router.push('/admin/providers')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/admin/providers/api?id=${provider?.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || '删除失败')
      }

      router.push('/admin/providers')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleVerifyNow = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/admin/providers/api?id=${provider?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' }),
      })

      if (!res.ok) {
        throw new Error('核验失败')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <Card title="基本信息">
          <div className="space-y-4">
            <Input
              name="name"
              label="中文名称"
              required
              fullWidth
              defaultValue={provider?.name}
              placeholder="例如: OpenAI 官方"
            />

            <Input
              name="name_en"
              label="英文名称"
              fullWidth
              defaultValue={provider?.name_en || ''}
              placeholder="例如: OpenAI Official"
            />

            <Input
              name="slug"
              label="URL Slug"
              required
              fullWidth
              pattern="[a-z0-9-]+"
              defaultValue={provider?.slug}
              placeholder="例如: openai-official"
              helperText="仅小写字母、数字、短横线"
            />

            <Input
              name="website_url"
              label="官网链接"
              type="url"
              fullWidth
              defaultValue={provider?.website_url || ''}
              placeholder="https://example.com"
            />

            <Textarea
              name="description"
              label="简介"
              rows={4}
              fullWidth
              defaultValue={provider?.description || ''}
              placeholder="简要介绍该服务商的特点和优势"
            />

            <Input
              name="features"
              label="特色功能"
              fullWidth
              defaultValue={provider?.features?.join(', ') || ''}
              placeholder="支持GPT-4, 按需计费, 无需翻墙"
              helperText="用逗号分隔多个特色功能"
            />
          </div>
        </Card>

        <Card title="状态设置">
          <div className="space-y-4">
            <Checkbox
              name="is_recommended"
              label="推荐服务商"
              defaultChecked={provider?.is_recommended}
            />

            <Select
              name="status"
              label="状态"
              required
              fullWidth
              options={statusOptions}
              defaultValue={provider?.status || 'draft'}
            />

            <Input
              name="sort_order"
              label="排序权重"
              type="number"
              fullWidth
              defaultValue={provider?.sort_order?.toString() || '0'}
              helperText="数字越大越靠前"
            />
          </div>
        </Card>

        <Card title="运营信息">
          <div className="space-y-4">
            <Input
              name="min_topup"
              label="最低充值金额"
              fullWidth
              defaultValue={provider?.min_topup || ''}
              placeholder="例如: ¥10, $5, 无门槛"
            />

            <Input
              name="trial_credit"
              label="注册赠送额度"
              fullWidth
              defaultValue={provider?.trial_credit || ''}
              placeholder="例如: $0.5, ¥7, 无"
            />

            <Input
              name="transaction_fee"
              label="充值手续费"
              fullWidth
              defaultValue={provider?.transaction_fee || ''}
              placeholder="例如: 3%, 无, 支付宝 2% / USDT 无"
            />

            <Checkbox
              name="invoice_support"
              label="支持开具发票"
              defaultChecked={provider?.invoice_support}
            />

            <Select
              name="verification_status"
              label="检测状态"
              fullWidth
              options={verificationOptions}
              defaultValue={provider?.verification_status || ''}
            />
          </div>
        </Card>

        {mode === 'edit' && provider?.verified_at && (
          <Card>
            <div className="text-sm text-gray-700">
              <strong>最后核验时间:</strong> {new Date(provider.verified_at).toLocaleString('zh-CN')}
            </div>
          </Card>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={loading} disabled={loading}>
            {mode === 'create' ? '创建' : '保存'}
          </Button>

          {mode === 'edit' && (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={handleVerifyNow}
                disabled={loading}
              >
                标记已核验
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                删除
              </Button>
            </>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            取消
          </Button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="确认删除"
        message={`确定要删除服务商"${provider?.name}"吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
        loading={loading}
      />
    </>
  )
}
