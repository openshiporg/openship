'use client'

import React, { ReactNode } from 'react'
import Link from 'next/link'

// CellContainer component
interface CellContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export function CellContainer({ children, className = '', ...props }: CellContainerProps) {
  return (
    <div
      {...props}
    >
      {children}
    </div>
  )
}

// CellLink component
interface CellLinkProps {
  children: ReactNode
  href: string
  className?: string
  [key: string]: any
}

export function CellLink({ children, href, className = '', ...props }: CellLinkProps) {
  return (
    <Link
      href={href}
      className={`text-foreground block p-2 no-underline hover:underline ${className}`}
      {...props}
    >
      {children}
    </Link>
  )
}