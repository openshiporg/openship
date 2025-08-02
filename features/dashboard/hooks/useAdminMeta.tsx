/**
 * Hooks for admin metadata and list management
 * Based on Keystone's context hooks from packages/core/src/admin-ui/context.tsx
 */

'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import useSWR from 'swr'
import { getAdminMetaAction } from '../actions/getAdminMetaAction'

// Types
export interface AdminMeta {
  lists: ListMeta[]
  enableSessionItem: boolean
  enableSignout: boolean
  [key: string]: any
}

export interface ListMeta {
  key: string
  path: string
  label: string
  singular: string
  plural: string
  description?: string
  fields: FieldMeta[]
  pageSize?: number
  hideCreate?: boolean
  hideDelete?: boolean
  [key: string]: any
}

export interface FieldMeta {
  path: string
  label: string
  fieldMeta: {
    kind: string
    mode?: string
    many?: boolean
    labelField?: string
    [key: string]: any
  }
  isRequired?: boolean
  [key: string]: any
}

// Context for admin metadata
const AdminMetaContext = createContext<{
  adminMeta: AdminMeta | null
  error: Error | null 
  isLoading: boolean
  mutate: () => void
} | null>(null)

// Context Provider
export function AdminMetaProvider({ 
  children, 
  initialData 
}: { 
  children: ReactNode
  initialData?: AdminMeta
}) {
  const { data: response, error, isLoading, mutate } = useSWR(
    'admin-meta',
    async () => {
      const result = await getAdminMetaAction()
      if (!result.success) {
        throw new Error(result.error || 'Failed to load admin metadata')
      }
      
      // Lists are already enhanced with gqlNames from getAdminMetaAction
      return result.data
    },
    {
      fallbackData: initialData,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return (
    <AdminMetaContext.Provider 
      value={{
        adminMeta: response || null,
        error,
        isLoading,
        mutate
      }}
    >
      {children}
    </AdminMetaContext.Provider>
  )
}

/**
 * Hook to get admin metadata
 * Similar to Keystone's useKeystone hook
 */
export function useAdminMeta() {
  const context = useContext(AdminMetaContext)
  if (!context) {
    throw new Error('useAdminMeta must be used within AdminMetaProvider')
  }
  return context
}

/**
 * Hook to get a specific list by key or path
 * Similar to Keystone's useList hook
 */
export function useList(listKeyOrPath: string) {
  const { adminMeta, error, isLoading } = useAdminMeta()
  
  if (!adminMeta?.lists) {
    return { list: null, error, isLoading }
  }
  
  // Find list by key or path
  const list = adminMeta.lists.find(
    (l: ListMeta) => l.key === listKeyOrPath || l.path === listKeyOrPath
  )
  
  // Transform fields into a record for easier access
  const transformedList = list ? {
    ...list,
    fields: list.fields.reduce((acc: Record<string, FieldMeta>, field: FieldMeta) => {
      acc[field.path] = field
      return acc
    }, {})
  } : null
  
  return { 
    list: transformedList, 
    error, 
    isLoading 
  }
}

/**
 * Hook to get all lists
 */
export function useLists() {
  const { adminMeta, error, isLoading } = useAdminMeta()
  
  return {
    lists: adminMeta?.lists || [],
    error,
    isLoading
  }
}

/**
 * Hook to get navigation items for the dashboard
 */
export function useNavigation() {
  const { adminMeta, error, isLoading } = useAdminMeta()
  
  const navigation = adminMeta?.lists?.map((list: ListMeta) => ({
    key: list.key,
    path: list.path,
    label: list.label,
    description: list.description
  })) || []
  
  return {
    navigation,
    error,
    isLoading
  }
}

/**
 * Mock authentication context - replace with actual auth implementation
 */
export function useAuth() {
  // This should be replaced with your actual authentication logic
  return {
    user: null,
    isAuthenticated: false,
    signIn: async (_credentials: any) => {
      // Implement actual sign in
    },
    signOut: async () => {
      // Implement actual sign out
    }
  }
}

// Legacy exports for compatibility
export const useKeystone = useAdminMeta