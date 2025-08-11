/**
 * dashboardLayout - Client component that receives server-side data
 * Follows Dashboard1's pattern: server layout fetches data, client layout provides it
 */

'use client'

import React from 'react'
import { AdminMetaProvider } from '../hooks/useAdminMeta'
import { SidebarProvider, SidebarInset, useSidebarWithSide } from '@/components/ui/sidebar'
import { Sidebar } from './Sidebar'
import { ErrorBoundary } from './ErrorBoundary'
import { DashboardProvider } from '../context/DashboardProvider'
import { RightSidebar } from './dual-sidebar/right-sidebar'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
  adminMeta?: any
  authenticatedItem?: any
}

function FloatingChatButton() {
  const { toggleSidebar, open } = useSidebarWithSide('right')
  const Icon = open ? ChevronRight : Sparkles;
  
  return (
    <Button
      onClick={toggleSidebar}
      size="icon"
      className={cn(
        "fixed bottom-3 z-40 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
        open ? "right-[calc(30rem+1rem)] bg-background hover:bg-accent" : "right-3"
      )}
    >
        <Icon 
          
        />
        
    </Button>
  )
}

function DashboardLayoutContent({ children, adminMeta, authenticatedItem }: DashboardLayoutProps) {
  return (
    <>
      <Sidebar adminMeta={adminMeta} user={authenticatedItem} />
      <SidebarInset className="min-w-0">
        {children}
      </SidebarInset>
      <RightSidebar side="right" />
      <FloatingChatButton />
    </>
  )
}

export function DashboardLayout({ children, adminMeta, authenticatedItem }: DashboardLayoutProps) {
  return (
    <ErrorBoundary>
      <DashboardProvider>
        <AdminMetaProvider initialData={adminMeta}>
          <SidebarProvider defaultOpenRight={false}>
            <DashboardLayoutContent adminMeta={adminMeta} authenticatedItem={authenticatedItem}>
              {children}
            </DashboardLayoutContent>
          </SidebarProvider>
        </AdminMetaProvider>
      </DashboardProvider>
    </ErrorBoundary>
  )
}

export default DashboardLayout