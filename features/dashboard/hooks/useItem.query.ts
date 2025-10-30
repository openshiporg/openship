/**
 * React Query hook for Single Item
 */

'use client'

import { createQueryHook } from './useQueryFactory'
import { getItemAction } from '../actions/getItemAction'
import { queryKeys } from '../lib/queryKeys'

/**
 * Parameters for item query
 */
export interface ItemParams {
  list: any
  itemId: string
  options?: any
}

/**
 * Hook for fetching a single item with all its fields
 * Includes field-level permissions from adminMeta
 */
export const useItemQuery = createQueryHook(
  (params: ItemParams) => queryKeys.items.item(params.list.key, params.itemId),
  async (params: ItemParams) => {
    return await getItemAction(params.list, params.itemId, params.options)
  },
  {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  }
)
