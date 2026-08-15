import { getProviders, getExpiredProviders } from '@/lib/providers'
import { ProvidersClient } from './ProvidersClient'

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search || ''
  const statusFilter = params.status || ''
  const pageSize = 20

  // 获取所有服务商（不分页）用于客户端筛选
  const { data: allProviders } = await getProviders(undefined, undefined, 1, 9999)
  const expiredProviders = await getExpiredProviders()

  // 过滤
  let filteredProviders = allProviders

  if (search) {
    filteredProviders = filteredProviders.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.name_en?.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase())
    )
  }

  if (statusFilter) {
    filteredProviders = filteredProviders.filter((p) => p.status === statusFilter)
  }

  // 分页
  const totalCount = filteredProviders.length
  const totalPages = Math.ceil(totalCount / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedProviders = filteredProviders.slice(startIndex, endIndex)

  return (
    <ProvidersClient
      providers={paginatedProviders}
      expiredProviders={expiredProviders}
      totalCount={totalCount}
      currentPage={page}
      totalPages={totalPages}
      initialSearch={search}
      initialStatus={statusFilter}
    />
  )
}
