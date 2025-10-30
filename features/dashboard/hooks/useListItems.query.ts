/**
 * React Query hook for List Items
 */

'use client'

import { createQueryHook } from './useQueryFactory'
import { getListItemsAction } from '../actions/getListItemsAction'
import { queryKeys } from '../lib/queryKeys'

/**
 * Parameters for list items query
 */
export interface ListItemsParams {
  listKey: string
  variables: {
    where?: any
    take: number
    skip: number
    orderBy?: any[]
  }
  selectedFields?: string[] | string
}

/**
 * Hook for fetching paginated list items
 * Supports filtering, sorting, and field selection
 *
 * IMPORTANT: To avoid closure issues during refetches, we store all params
 * in the queryKey so they can be extracted during refetch
 */
export const useListItemsQuery = createQueryHook(
  // Store ALL params in queryKey to avoid closure issues
  (params: ListItemsParams) => [
    ...queryKeys.lists.items(params.listKey, params.variables),
    { selectedFields: params.selectedFields }
  ] as const,
  async (params: ListItemsParams) => {
    return await getListItemsAction(
      params.listKey,
      params.variables,
      params.selectedFields
    )
  },
  {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  }
)
