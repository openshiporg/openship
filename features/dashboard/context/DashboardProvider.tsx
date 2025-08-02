/**
 * DashboardProvider - Context provider for Dashboard 2
 * Manages global dashboard state and configuration
 */

import React, { createContext, useContext, ReactNode } from 'react'

interface DashboardContextType {
  basePath: string
  version: string
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

interface DashboardProviderProps {
  children: ReactNode
  basePath?: string
  version?: string
}

export function DashboardProvider({ 
  children, 
  basePath = '/dashboard',
  version = '2.0.0'
}: DashboardProviderProps) {
  const value = {
    basePath,
    version
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

export default DashboardProvider