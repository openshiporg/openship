/**
 * Query and Mutation Factory Utilities
 * Type-safe helpers for creating React Query hooks
 */

import React from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from '@tanstack/react-query'
import type { KeystoneResponse } from '../lib/keystoneClient'

/**
 * Helper to extract data from KeystoneResponse and throw on error
 */
function unwrapResponse<T>(response: KeystoneResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error)
  }
  return response.data
}

/**
 * Create a type-safe query hook
 *
 * @example
 * const useAdminMetaQuery = createQueryHook(
 *   () => queryKeys.adminMeta,
 *   async () => await getAdminMetaAction(),
 *   { staleTime: Infinity }
 * )
 */
export function createQueryHook<TData, TParams = void>(
  queryKeyFn: (params: TParams) => readonly unknown[],
  queryFn: (params: TParams) => Promise<KeystoneResponse<TData>>,
  defaultOptions?: Partial<UseQueryOptions<TData, Error>>
) {
  return function useCustomQuery(
    params: TParams,
    options?: Partial<UseQueryOptions<TData, Error>>
  ) {
    // Generate the query key - it should contain all necessary params
    const queryKey = queryKeyFn(params)

    // CRITICAL FIX: Use a ref to store the latest params
    // This ensures that when React Query refetches (on window focus, reconnect, etc.),
    // the queryFn always uses the CURRENT params, not stale closure values
    //
    // Why this is needed:
    // 1. When a component renders with params A, the queryFn closure captures params A
    // 2. React Query stores this queryFn
    // 3. If params change to B, a NEW queryFn is created with params B
    // 4. However, if React reuses the component instance and the queryFn closure is stale,
    //    refetches might use old params
    // 5. By using a ref, we ensure the queryFn ALWAYS reads the latest params
    const paramsRef = React.useRef(params)
    // Update ref on every render (before the effect phase)
    // Using useLayoutEffect to ensure ref is updated synchronously
    React.useLayoutEffect(() => {
      paramsRef.current = params
    })

    // Create a stable queryFn that reads from the ref
    const stableQueryFn = React.useCallback(
      async () => {
        // Always use the latest params from the ref, not the closure
        return unwrapResponse(await queryFn(paramsRef.current))
      },
      [queryFn] // queryFn is stable (defined at module level), only recreate if it changes
    )

    return useQuery({
      queryKey,
      queryFn: stableQueryFn,
      ...defaultOptions,
      ...options,
    } as UseQueryOptions<TData, Error>)
  }
}

/**
 * Options for mutation hook factory
 */
interface MutationHookOptions<TData, TVariables> {
  /**
   * Query keys to invalidate on success
   * Can be a static array or a function that receives variables and data
   */
  invalidateKeys?:
    | readonly (readonly unknown[])[]
    | ((variables: TVariables, data: TData) => readonly (readonly unknown[])[])

  /**
   * Additional onSuccess callback
   */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>

  /**
   * Additional onError callback
   */
  onError?: (error: Error, variables: TVariables) => void

  /**
   * Optimistic update function
   */
  onMutate?: (variables: TVariables) => void | Promise<void>
}

/**
 * Create a type-safe mutation hook
 *
 * @example
 * const useUpdateItemMutation = createMutationHook(
 *   async (params: UpdateItemParams) => await updateItemAction(params),
 *   {
 *     invalidateKeys: (variables) => [
 *       queryKeys.items.item(variables.listKey, variables.itemId),
 *       queryKeys.lists.items(variables.listKey),
 *     ]
 *   }
 * )
 */
export function createMutationHook<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<KeystoneResponse<TData>>,
  hookOptions?: MutationHookOptions<TData, TVariables>
) {
  return function useCustomMutation(
    userOptions?: Omit<UseMutationOptions<TData, Error, TVariables, unknown>, 'mutationFn'>
  ) {
    const queryClient = useQueryClient()

    const combinedOptions: UseMutationOptions<TData, Error, TVariables> = {
      mutationFn: async (variables: TVariables) => {
        return unwrapResponse(await mutationFn(variables))
      },
    }

    // Add onSuccess handler if we have invalidation keys or callbacks
    if (hookOptions?.invalidateKeys || hookOptions?.onSuccess || userOptions?.onSuccess) {
      combinedOptions.onSuccess = async (data, variables, context) => {
        // Invalidate related queries
        if (hookOptions?.invalidateKeys) {
          const keysToInvalidate =
            typeof hookOptions.invalidateKeys === 'function'
              ? hookOptions.invalidateKeys(variables, data)
              : hookOptions.invalidateKeys

          for (const key of keysToInvalidate) {
            await queryClient.invalidateQueries({ queryKey: key as QueryKey })
          }
        }

        // Call custom onSuccess
        await hookOptions?.onSuccess?.(data, variables)

        // Call provided onSuccess
        if (userOptions?.onSuccess) {
          // @ts-expect-error - Context type mismatch is acceptable here
          await userOptions.onSuccess(data, variables, context)
        }
      }
    }

    // Add onError handler if we have callbacks
    if (hookOptions?.onError || userOptions?.onError) {
      combinedOptions.onError = (error, variables, context) => {
        hookOptions?.onError?.(error, variables)

        if (userOptions?.onError) {
          // @ts-expect-error - Context type mismatch is acceptable here
          userOptions.onError(error, variables, context)
        }
      }
    }

    // Add onMutate handler if we have callbacks
    if (hookOptions?.onMutate || userOptions?.onMutate) {
      combinedOptions.onMutate = async (variables) => {
        await hookOptions?.onMutate?.(variables)

        if (userOptions?.onMutate) {
          // @ts-expect-error - Context type mismatch is acceptable here
          return await userOptions.onMutate(variables)
        }
      }
    }

    return useMutation<TData, Error, TVariables>(combinedOptions)
  }
}
