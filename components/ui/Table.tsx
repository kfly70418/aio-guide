import { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: ReactNode
  render?: (row: T, index: number) => ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T, index: number) => string
  emptyMessage?: string
  loading?: boolean
  hover?: boolean
  striped?: boolean
  className?: string
}

export function Table<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = '暂无数据',
  loading = false,
  hover = true,
  striped = false,
  className = '',
}: TableProps<T>) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-500">加载中...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  alignClasses[column.align || 'left']
                }`}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`bg-white divide-y divide-gray-200 ${striped ? '[&>tr:nth-child(even)]:bg-gray-50' : ''}`}>
          {data.map((row, rowIndex) => (
            <tr
              key={keyExtractor(row, rowIndex)}
              className={hover ? 'hover:bg-gray-100 transition-colors' : ''}
            >
              {columns.map((column) => (
                <td
                  key={`${keyExtractor(row, rowIndex)}-${column.key}`}
                  className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                    alignClasses[column.align || 'left']
                  }`}
                >
                  {column.render
                    ? column.render(row, rowIndex)
                    : (row as any)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
