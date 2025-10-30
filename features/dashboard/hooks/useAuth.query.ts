/**
 * React Query hook for Authentication
 */

'use client'

import { createQueryHook } from './useQueryFactory'
import { getAuthenticatedUser } from '../actions/auth'
import { queryKeys } from '../lib/queryKeys'

/**
 * Hook for fetching the authenticated user
 * Cached for 1 minute to reduce unnecessary requests
 */
export const useAuthenticatedUserQuery = createQueryHook(
  () => queryKeys.auth.user,
  async () => await getAuthenticatedUser(),
  {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once for auth
  }
)
