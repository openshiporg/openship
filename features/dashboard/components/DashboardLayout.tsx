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
import { FloatingChatBox } from './dual-sidebar/floating-chat-box'
import { ChevronRight, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Chat mode context
type ChatMode = 'sidebar' | 'chatbox';

// Shared Message type
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatModeContextType {
  chatMode: ChatMode;
  setChatMode: (mode: ChatMode) => void;
  isFloatingChatVisible: boolean;
  setIsFloatingChatVisible: (visible: boolean) => void;
  // Shared messages state
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  // Shared loading states
  loading: boolean;
  setLoading: (loading: boolean) => void;
  sending: boolean;
  setSending: (sending: boolean) => void;
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
  const { toggleSidebar, open } = useSidebarWithSide('right')
  const { chatMode, isFloatingChatVisible, setIsFloatingChatVisible } = useChatMode()
  
  const handleClick = () => {
    if (chatMode === 'sidebar') {
      toggleSidebar()
    } else {
      setIsFloatingChatVisible(!isFloatingChatVisible)
    }
  }
  
  const Icon = chatMode === 'sidebar' && open 
    ? ChevronRight 
    : chatMode === 'chatbox' && isFloatingChatVisible
    ? X
    : Sparkles;
  
  return (
    <Button
      onClick={handleClick}
      size="icon"
      className={cn(
        "fixed bottom-3 z-40 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
        chatMode === 'sidebar' && open
          ? "right-[calc(30rem+1rem)] bg-background hover:bg-accent" 
          : "right-3"
      )}
    >
      <Icon className="h-5 w-5" />
    </Button>
  )
}

function DashboardLayoutContent({ children, adminMeta, authenticatedItem }: DashboardLayoutProps) {
  const { chatMode, setChatMode, isFloatingChatVisible, setIsFloatingChatVisible } = useChatMode()
  
  return (
    <>
      <Sidebar adminMeta={adminMeta} user={authenticatedItem} />
      <SidebarInset className="min-w-0">
        {children}
      </SidebarInset>
      {chatMode === 'sidebar' && <RightSidebar side="right" />}
      <FloatingChatButton />
      
      {/* Floating Chat Box */}
      {chatMode === 'chatbox' && (
        <FloatingChatBox
          isVisible={isFloatingChatVisible}
          onClose={() => setIsFloatingChatVisible(false)}
          onModeChange={() => setChatMode('sidebar')}
        />
      )}
    </>
  )
}

function ChatModeProvider({ children }: { children: React.ReactNode }) {
  const [chatMode, setChatMode] = useState<ChatMode>('chatbox')
  const [isFloatingChatVisible, setIsFloatingChatVisible] = useState(false)
  
  // Shared chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  
  // Auto-open chat box when switching to chatbox mode
  const handleSetChatMode = (mode: ChatMode) => {
    setChatMode(mode)
    if (mode === 'chatbox') {
      setIsFloatingChatVisible(true)
    }
  }
  
  return (
    <ChatModeContext.Provider value={{
      chatMode,
      setChatMode: handleSetChatMode,
      isFloatingChatVisible,
      setIsFloatingChatVisible,
      messages,
      setMessages,
      loading,
      setLoading,
      sending,
      setSending
    }}>
      {children}
    </ChatModeContext.Provider>
  )
}

export function DashboardLayout({ children, adminMeta, authenticatedItem }: DashboardLayoutProps) {
  return (
    <ErrorBoundary>
      <DashboardProvider>
        <AdminMetaProvider initialData={adminMeta}>
          <ChatModeProvider>
            <SidebarProvider defaultOpenRight={false}>
              <DashboardLayoutContent adminMeta={adminMeta} authenticatedItem={authenticatedItem}>
                {children}
              </DashboardLayoutContent>
            </SidebarProvider>
          </ChatModeProvider>
        </AdminMetaProvider>
      </DashboardProvider>
    </ErrorBoundary>
  )
}

export default DashboardLayout