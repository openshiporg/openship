/**
 * dashboardLayout - Client component that receives server-side data
 * Follows Dashboard1's pattern: server layout fetches data, client layout provides it
 */

'use client'

import React, { createContext, useContext, useState } from 'react'
import { AdminMetaProvider } from '../hooks/useAdminMeta'
import { SidebarProvider, SidebarInset, useSidebarWithSide } from '@/components/ui/sidebar'
import { Sidebar } from './Sidebar'
import { ErrorBoundary } from './ErrorBoundary'
import { DashboardProvider } from '../context/DashboardProvider'
import { RightSidebar } from './dual-sidebar/right-sidebar'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AiConfigProvider } from '../hooks/use-ai-config'
import { QueryProvider } from '../providers/QueryProvider'

// Shared Message type
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatModeContextType {
  // Shared messages state
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  // Shared loading states
  loading: boolean;
  setLoading: (loading: boolean) => void;
  sending: boolean;
  setSending: (sending: boolean) => void;
  // User data for personalization
  user?: any;
}

const ChatModeContext = createContext<ChatModeContextType | null>(null);

export function useChatMode() {
  const context = useContext(ChatModeContext);
  if (!context) {
    throw new Error('useChatMode must be used within ChatModeProvider');
  }
  return context;
}

interface DashboardLayoutProps {
  children: React.ReactNode
  adminMeta?: any
  authenticatedItem?: any
}

function FloatingChatButton() {
  const { toggleSidebar, open, isMobile } = useSidebarWithSide('right')

  // On mobile, sidebar is always overlaid, so don't show chevron when "open"
  // Only show chevron when sidebar is actually visible on screen (desktop + open)
  const showChevron = open && !isMobile

  const Icon = showChevron ? ChevronRight : Sparkles;

  return (
    <Button
      onClick={toggleSidebar}
      size="icon"
      className={cn(
        "fixed bottom-3 z-40 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
        showChevron
          ? "right-[calc(18rem+1rem)] md:right-[calc(30rem+1rem)] bg-background hover:bg-accent"
          : "right-3"
      )}
    >
      <Icon className="h-5 w-5" />
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

function ChatModeProvider({ children, user }: { children: React.ReactNode; user?: any }) {
  // Shared chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  return (
    <ChatModeContext.Provider value={{
      messages,
      setMessages,
      loading,
      setLoading,
      sending,
      setSending,
      user
    }}>
      {children}
    </ChatModeContext.Provider>
  )
}

export function DashboardLayout({ children, adminMeta, authenticatedItem }: DashboardLayoutProps) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <DashboardProvider>
          <AdminMetaProvider initialData={adminMeta}>
            <AiConfigProvider>
              <ChatModeProvider user={authenticatedItem}>
                <SidebarProvider defaultOpenRight={false}>
                  <DashboardLayoutContent adminMeta={adminMeta} authenticatedItem={authenticatedItem}>
                    {children}
                  </DashboardLayoutContent>
                </SidebarProvider>
              </ChatModeProvider>
            </AiConfigProvider>
          </AdminMetaProvider>
        </DashboardProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}

export default DashboardLayout