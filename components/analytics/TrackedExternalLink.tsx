'use client'

import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { track } from '@vercel/analytics'

interface TrackedExternalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  providerSlug: string
  placement: string
  children: ReactNode
}

export function TrackedExternalLink({
  providerSlug,
  placement,
  onClick,
  children,
  ...props
}: TrackedExternalLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        track('provider_outbound_click', { provider: providerSlug, placement })
        onClick?.(event)
      }}
    >
      {children}
    </a>
  )
}
