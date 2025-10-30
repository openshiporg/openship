/**
 * React Query hooks for Admin Metadata
 */

'use client'

import { createQueryHook } from './useQueryFactory'
import { getAdminMetaAction } from '../actions/getAdminMetaAction'
import { queryKeys } from '../lib/queryKeys'

/**
 * Hook for fetching complete admin metadata (all lists and fields)
 * This data is stable and cached indefinitely
 */
export const useAdminMetaQuery = createQueryHook(
  () => queryKeys.adminMeta,
  async () => await getAdminMetaAction(),
  {
    staleTime: Infinity, // Admin meta rarely changes
    gcTime: Infinity, // Keep in cache forever
  }
)

/**
 * Hook for fetching a specific list's metadata
 * Includes fields, validation, and GraphQL query names
 */
export const useListMetaQuery = createQueryHook(
  (listKey: string) => queryKeys.list(listKey),
  async (listKey: string) => {
    const response = await getAdminMetaAction(listKey)
    return response
  },
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  }
)
