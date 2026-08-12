import { getProviders, getExpiredProviders } from '@/lib/providers'
import Link from 'next/link'
import { formatDateTime, isExpired } from '@/lib/utils'
import { Button, Badge, Table } from '@/components/ui'
import type { Column } from '@/components/ui'
import type { Provider } from '@/lib/types'

export default async function ProvidersPage() {
  const { data: providers } = await getProviders()
  const expiredProviders = await getExpiredProviders()

  const columns: Column<Provider>[] = [
    {
      key: 'name',
      header: '名称',
      render: (provider) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{provider.name}</div>
          {provider.name_en && (
            <div className="text-sm text-gray-500">{provider.name_en}</div>
          )}
        </div>
      ),
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (provider) => (
        <span className="text-sm text-gray-500">{provider.slug}</span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (provider) => {
        const variants = {
          published: 'success' as const,
          draft: 'warning' as const,
          archived: 'default' as const,
        }
        const labels = {
          published: '已发布',
          draft: '草稿',
          archived: '已归档',
        }
        return (
          <Badge variant={variants[provider.status]}>
            {labels[provider.status]}
          </Badge>
        )
      },
    },
    {
      key: 'is_recommended',
      header: '推荐',
      render: (provider) => (
        <span className="text-sm text-gray-500">
          {provider.is_recommended ? '是' : '否'}
        </span>
      ),
    },
    {
      key: 'verified_at',
      header: '核验时间',
      render: (provider) => {
        if (!provider.verified_at) {
          return <Badge variant="danger">未核验</Badge>
        }
        const expired = isExpired(provider.verified_at)
        return (
          <div>
            <div className={expired ? 'text-red-600 text-sm' : 'text-gray-900 text-sm'}>
              {formatDateTime(provider.verified_at)}
            </div>
            {expired && (
              <Badge variant="danger" size="sm">已过期</Badge>
            )}
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: '操作',
      render: (provider) => (
        <div className="flex gap-2">
          <Link
            href={`/admin/providers/${provider.id}`}
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            编辑
          </Link>
          <Link
            href={`/admin/providers/${provider.id}/channels`}
            className="text-green-600 hover:text-green-900 text-sm font-medium"
          >
            渠道
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">服务商管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            共 {providers.length} 个服务商
            {expiredProviders.length > 0 && (
              <span className="ml-2 text-red-600">
                · {expiredProviders.length} 个需要核验
              </span>
            )}
          </p>
        </div>
        <Link href="/admin/providers/new">
          <Button>新增服务商</Button>
        </Link>
      </div>

      {expiredProviders.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">核验提醒</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>以下服务商超过 30 天未核验，请及时更新：</p>
                <ul className="mt-1 list-disc list-inside">
                  {expiredProviders.slice(0, 5).map((provider) => (
                    <li key={provider.id}>
                      <Link
                        href={`/admin/providers/${provider.id}`}
                        className="hover:underline"
                      >
                        {provider.name}
                      </Link>
                      {provider.verified_at && (
                        <span className="text-xs ml-2">
                          (上次核验: {formatDateTime(provider.verified_at)})
                        </span>
                      )}
                    </li>
                  ))}
                  {expiredProviders.length > 5 && (
                    <li className="text-xs">还有 {expiredProviders.length - 5} 个...</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <Table
        data={providers}
        columns={columns}
        keyExtractor={(provider) => provider.id}
        emptyMessage="暂无服务商"
        hover
      />
    </div>
  )
}
