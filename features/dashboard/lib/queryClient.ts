/**
 * React Query Client Configuration
 * Centralized configuration for all queries and mutations
 */

import { QueryClient } from '@tanstack/react-query'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache for 5 minutes by default
        staleTime: 5 * 60 * 1000,
        // Keep unused data for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed requests 3 times
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false
          }
          return failureCount < 3
        },
        // Retry delay with exponential backoff
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Don't refetch on window focus by default (can override per query)
        refetchOnWindowFocus: false,
        // Refetch on reconnect
        refetchOnReconnect: true,
        // Show error state immediately
        throwOnError: false,
      },
      mutations: {
        // Don't retry mutations by default (they might not be idempotent)
        retry: false,
        // Throw errors from mutations
        throwOnError: false,
      },
    },
  })
}

// Export a singleton instance for server-side use
export const queryClient = createQueryClient()
