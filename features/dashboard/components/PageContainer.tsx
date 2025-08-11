/**
 * PageContainer component - Page wrapper with breadcrumbs and header
 * Based on Keystone's PageContainer with Dashboard 1's styling
 */

import React, { ReactNode } from 'react'
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { MessagesSquare, Sparkles } from 'lucide-react'

interface BreadcrumbItem {
  type: 'link' | 'page'
  label: string
  href?: string
}

interface PageContainerProps {
  children: ReactNode
  title?: string
  header?: ReactNode
  breadcrumbs?: BreadcrumbItem[]
}

export function PageContainer({ children, title, header, breadcrumbs }: PageContainerProps) {
  return (
    <div className="flex flex-col space-y-4">
      {/* Header with breadcrumbs */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbItem>
                      {item.type === 'link' && item.href ? (
                        <BreadcrumbLink href={item.href}>
                          {item.label}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>
        
      </header>

      {/* Page header section */}
      {header && (
        <div className="flex flex-col space-y-1.5 px-4 md:px-6">
          {header}
        </div>
      )}

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

export default PageContainer