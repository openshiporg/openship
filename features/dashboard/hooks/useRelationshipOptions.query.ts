/**
 * React Query hook for Relationship Options
 */

'use client'

import { createQueryHook } from './useQueryFactory'
import { getRelationshipOptions } from '../actions/relationship'
import { queryKeys } from '../lib/queryKeys'

/**
 * Parameters for relationship options query
 */
export interface RelationshipOptionsParams {
  listKey: string
  where: Record<string, unknown>
  take: number
  skip: number
  labelField: string
  extraSelection: string
  gqlNames: {
    whereInputName: string
    listQueryName: string
    listQueryCountName: string
  }
}

/**
 * Hook for fetching relationship select options
 * Supports search and pagination
 */
export const useRelationshipOptionsQuery = createQueryHook(
  (params: RelationshipOptionsParams) =>
    queryKeys.relationships.options(params.listKey, {
      where: params.where,
      skip: params.skip,
      take: params.take,
    }),
  async (params: RelationshipOptionsParams) => {
    return await getRelationshipOptions(
      params.listKey,
      params.where,
      params.take,
      params.skip,
      params.labelField,
      params.extraSelection,
      params.gqlNames
    )
  },
  {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    // Keep previous data while fetching new page for smooth pagination
    placeholderData: (previousData) => previousData,
  }
)
