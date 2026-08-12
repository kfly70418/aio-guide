import { ReactNode } from 'react'

export interface CardProps {
  children: ReactNode
  title?: string
  subtitle?: string
  footer?: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

export function Card({
  children,
  title,
  subtitle,
  footer,
  className = '',
  padding = 'md',
  hover = false,
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const hoverClass = hover ? 'hover:shadow-lg transition-shadow' : ''

  return (
    <div className={`bg-white rounded-lg shadow ${hoverClass} ${className}`}>
      {(title || subtitle) && (
        <div className={`border-b border-gray-200 ${paddingClasses[padding]}`}>
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}

      <div className={paddingClasses[padding]}>{children}</div>

      {footer && (
        <div className={`border-t border-gray-200 bg-gray-50 rounded-b-lg ${paddingClasses[padding]}`}>
          {footer}
        </div>
      )}
    </div>
  )
}
