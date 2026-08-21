'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDateTime, isExpired } from '@/lib/utils'
import { Button, Badge, Pagination } from '@/components/ui'
import type { Provider } from '@/lib/types'

interface ProvidersClientProps {
  providers: Provider[]
  expiredProviders: Provider[]
  totalCount: number
  currentPage: number
  totalPages: number
  initialSearch: string
  initialStatus: string
}

const VERIFICATION_OPTIONS = [
  { value: 'verified', label: '✓ 已核验', color: 'bg-green-600' },
  { value: 'pending', label: '⏳ 待核验', color: 'bg-yellow-500' },
  { value: 'suspect', label: '⚠️ 可疑', color: 'bg-orange-500' },
  { value: 'failed', label: '✗ 检测失败', color: 'bg-red-600' },
]

export function ProvidersClient({
  providers,
  expiredProviders,
  totalCount,
  currentPage,
  totalPages,
  initialSearch,
  initialStatus,
}: ProvidersClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [bulkMessage, setBulkMessage] = useState('')

  const allSelected = providers.length > 0 && selectedIds.size === providers.length

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(providers.map(p => p.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleBulkVerification = async (verificationStatus: string) => {
    if (selectedIds.size === 0) return
    setBulkUpdating(true)
    setBulkMessage('')

    try {
      const res = await fetch('/api/admin/providers/bulk-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          verification_status: verificationStatus,
          verified_at: verificationStatus === 'verified' ? new Date().toISOString() : null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '操作失败')

      setBulkMessage(`✅ 已将 ${selectedIds.size} 个服务商标记为「${VERIFICATION_OPTIONS.find(o => o.value === verificationStatus)?.label}」`)
      setSelectedIds(new Set())
      setTimeout(() => {
        setBulkMessage('')
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setBulkMessage(`❌ ${err.message}`)
    } finally {
      setBulkUpdating(false)
    }
  }

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    params.set('page', '1')
    router.push(`/admin/providers?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    params.set('page', page.toString())
    router.push(`/admin/providers?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatus('')
    router.push('/admin/providers')
  }

  const verificationBadge = (v: string | null) => {
    if (!v) return <span className="text-xs text-gray-400">-</span>
    const map: Record<string, { label: string; cls: string }> = {
      verified: { label: '已核验', cls: 'bg-green-100 text-green-800' },
      pending: { label: '待核验', cls: 'bg-yellow-100 text-yellow-800' },
      suspect: { label: '可疑', cls: 'bg-orange-100 text-orange-800' },
      failed: { label: '检测失败', cls: 'bg-red-100 text-red-800' },
    }
    const m = map[v]
    if (!m) return <span className="text-xs text-gray-400">{v}</span>
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${m.cls}`}>
        {m.label}
      </span>
    )
  }

  return (
    <div>
      {/* 标题行 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">服务商管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            共 {totalCount} 个服务商
            {expiredProviders.length > 0 && (
              <span className="ml-2 text-red-600">· {expiredProviders.length} 个需要核验</span>
            )}
          </p>
        </div>
        <Link href="/admin/providers/new">
          <Button>新增服务商</Button>
        </Link>
      </div>

      {/* 核验提醒 */}
      {expiredProviders.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">核验提醒</h3>
          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
            {expiredProviders.slice(0, 5).map(p => (
              <li key={p.id}>
                <Link href={`/admin/providers/${p.id}`} className="hover:underline">{p.name}</Link>
                {p.verified_at && <span className="text-xs ml-2">(上次: {formatDateTime(p.verified_at)})</span>}
              </li>
            ))}
            {expiredProviders.length > 5 && <li className="text-xs">还有 {expiredProviders.length - 5} 个...</li>}
          </ul>
        </div>
      )}

      {/* 搜索和筛选 */}
      <form onSubmit={handleFilter} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="搜索名称或 slug..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
            <option value="archived">已归档</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">筛选</button>
          {(search || status) && (
            <button type="button" onClick={handleClearFilters} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">清除</button>
          )}
        </div>
      </form>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-800">已选 {selectedIds.size} 个</span>
          <span className="text-blue-300">|</span>
          <span className="text-sm text-blue-700">批量设置检测状态：</span>
          {VERIFICATION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleBulkVerification(opt.value)}
              disabled={bulkUpdating}
              className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50 ${opt.color} hover:opacity-90`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-blue-600 hover:underline"
          >
            取消选择
          </button>
        </div>
      )}

      {/* 操作反馈 */}
      {bulkMessage && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${bulkMessage.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {bulkMessage}
        </div>
      )}

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-gray-300 text-blue-600"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">发布状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">检测状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">核验时间</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {providers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  {search || status ? '未找到匹配的服务商' : '暂无服务商'}
                </td>
              </tr>
            ) : (
              providers.map(provider => (
                <tr key={provider.id} className={`hover:bg-gray-50 ${selectedIds.has(provider.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(provider.id)}
                      onChange={() => toggleOne(provider.id)}
                      className="rounded border-gray-300 text-blue-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{provider.name}</div>
                    {provider.name_en && <div className="text-xs text-gray-500">{provider.name_en}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{provider.slug}</td>
                  <td className="px-4 py-3">
                    <Badge variant={provider.status === 'published' ? 'success' : provider.status === 'draft' ? 'warning' : 'default'}>
                      {provider.status === 'published' ? '已发布' : provider.status === 'draft' ? '草稿' : '已归档'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {verificationBadge(provider.verification_status)}
                  </td>
                  <td className="px-4 py-3">
                    {provider.verified_at ? (
                      <div>
                        <div className={isExpired(provider.verified_at) ? 'text-red-600 text-xs' : 'text-gray-700 text-xs'}>
                          {formatDateTime(provider.verified_at)}
                        </div>
                        {isExpired(provider.verified_at) && <Badge variant="danger" size="sm">已过期</Badge>}
                      </div>
                    ) : (
                      <Badge variant="danger">未核验</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/providers/${provider.id}`} className="text-blue-600 hover:underline text-sm">编辑</Link>
                      <Link href={`/admin/providers/${provider.id}/channels`} className="text-green-600 hover:underline text-sm">渠道</Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  )
}
