/**
 * React Query hook for List Metadata
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { getList } from '../actions/getList'
import { queryKeys } from '../lib/queryKeys'

/**
 * Hook for fetching list metadata
 * Used by relationship fields and other components that need list structure
 *
 * Note: getList returns the list object directly or null (not KeystoneResponse)
 */
export function useListQuery(listKey: string) {
  return useQuery({
    queryKey: queryKeys.lists.list(listKey),
    queryFn: async () => {
      const list = await getList(listKey)
      if (!list) {
        throw new Error(`List ${listKey} not found`)
      }
      return list
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
