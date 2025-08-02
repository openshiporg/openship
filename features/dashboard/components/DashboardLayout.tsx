/**
 * dashboardLayout - Client component that receives server-side data
 * Follows Dashboard1's pattern: server layout fetches data, client layout provides it
 */

'use client'

import React from 'react'
import { AdminMetaProvider } from '../hooks/useAdminMeta'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Sidebar } from './Sidebar'
import { ErrorBoundary } from './ErrorBoundary'
import { DashboardProvider } from '../context/DashboardProvider'
import { RightSidebar } from './dual-sidebar/right-sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  adminMeta?: any
  authenticatedItem?: any
}

export function DashboardLayout({ children, adminMeta, authenticatedItem }: DashboardLayoutProps) {
  return (
    <ErrorBoundary>
      <DashboardProvider>
        <AdminMetaProvider initialData={adminMeta}>
          <SidebarProvider defaultOpenRight={false}>
            <Sidebar adminMeta={adminMeta} user={authenticatedItem} />
            <SidebarInset className="min-w-0">
              {children}
            </SidebarInset>
            <RightSidebar side="right" />
          </SidebarProvider>
        </AdminMetaProvider>
      </DashboardProvider>
    </ErrorBoundary>
  )
}

export default DashboardLayout