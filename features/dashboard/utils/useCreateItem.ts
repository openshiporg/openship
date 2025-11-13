/**
 * useCreateItem hook - Manages item creation state and operations
 * Based on Keystone's useCreateItem but adapted for Dashboard 2's SWR patterns
 */

import { useState, useMemo, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { serializeValueToOperationItem } from './useHasChanges'
import { createItemAction } from '../actions/item-actions'
import { useInvalidFields } from './useInvalidFields'

interface CreateItemError {
  networkError?: Error
  graphQLErrors?: Array<{ message: string; path?: string[] }>
}

interface CreateItemState {
  state: 'idle' | 'loading' | 'error' | 'success'
  error: CreateItemError | null
  forceValidation: boolean
}

// Helper function outside component - exactly like Keystone's makeDefaultValueState
function makeDefaultValue(fields: Record<string, any>) {
  const result: Record<string, any> = {}
  for (const fieldKey in fields) {
    const field = fields[fieldKey]
    // Only add fields that have controllers with defaultValue
    // This matches Keystone's behavior and prevents undefined values
    if (field?.controller?.defaultValue !== undefined) {
      result[fieldKey] = field.controller.defaultValue
    }
  }
  return result
}

export function useCreateItem(list: any, enhancedFields: Record<string, any>, options?: { skipRevalidation?: boolean }) {
  // IMPORTANT: Always call all hooks unconditionally to follow React's rules
  const queryClient = useQueryClient()

  // State initialization - EXACT Keystone pattern
  const [forceValidation, setForceValidation] = useState(false)
  const [value, setValue] = useState(() => makeDefaultValue(enhancedFields || {}))
  const [state, setState] = useState<CreateItemState>({
    state: 'idle',
    error: null,
    forceValidation: false
  })

  // Create isRequireds map - SAME AS ITEMPAGE
  const isRequireds = useMemo(() => {
    if (!enhancedFields) return {}
    return Object.fromEntries(
      Object.entries(enhancedFields).map(([key, field]: [string, any]) => [
        key,
        field.createView?.isRequired || false
      ])
    )
  }, [enhancedFields])

  // Call useInvalidFields hook - SAME AS ITEMPAGE
  const invalidFields = useInvalidFields(enhancedFields || {}, value, isRequireds)

  // Update value onChange - SAME AS ITEMPAGE
  const onChange = useCallback((newValue: Record<string, any>) => {
    setValue(newValue)
  }, [])

  // Create item function - SAME PATTERN AS ITEMPAGE
  const create = useCallback(async () => {
    if (!list || !enhancedFields) return null

    // Check for invalid fields FIRST - exact Keystone/ItemPage pattern
    const newForceValidation = invalidFields.size !== 0
    setForceValidation(newForceValidation)
    if (newForceValidation) {
      return null
    }

    setState(prev => ({ ...prev, state: 'loading', error: null }))

    try {
      // Serialize the value for GraphQL mutation using enhanced fields
      const data = serializeValueToOperationItem('create', enhancedFields, value)

      // Get labelField from list to include in selected fields
      const selectedFields = `id ${list.labelField || ''}`

      // Call the server action to create the item
      const result = await createItemAction(list.key, data, selectedFields, options)

      if (result.errors && result.errors.length > 0) {
        setState(prev => ({
          ...prev,
          state: 'error',
          error: {
            graphQLErrors: result.errors.map((err: any) => ({
              ...err,
              path: err.path?.map((p: any) => String(p))
            }))
          }
        }))
        return null
      }

      setState(prev => ({ ...prev, state: 'success' }))

      // Invalidate React Query cache for the list so it refetches with the new item
      await queryClient.invalidateQueries({
        queryKey: ['lists', list.key, 'items']
      })

      return result.data?.item || null

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        state: 'error',
        error: {
          networkError: error.networkError,
          graphQLErrors: error.graphQLErrors || [{ message: error.message }]
        }
      }))
      return null
    }
  }, [list, enhancedFields, value, invalidFields, options, queryClient])

  // Props for the Fields component - SAME AS ITEMPAGE
  const props = useMemo(() => {
    if (!list || !enhancedFields) {
      return {
        view: 'createView' as const,
        position: 'form' as const,
        list: null,
        fields: {},
        groups: [],
        value: {},
        onChange,
        forceValidation: false,
        invalidFields: new Set<string>(),
        isRequireds: {}
      }
    }

    return {
      view: 'createView' as const,
      position: 'form' as const,
      list,
      fields: enhancedFields,
      groups: list.groups || [],
      value, // Use value directly, already has defaults
      onChange,
      forceValidation,
      invalidFields, // From the hook
      isRequireds
    }
  }, [
    list,
    enhancedFields,
    value,
    forceValidation,
    invalidFields,
    isRequireds,
    onChange
  ])

  // Return null if dependencies aren't ready, but only AFTER all hooks are called
  if (!list || !enhancedFields) return null

  return {
    state: state.state,
    error: state.error,
    props,
    create
  }
}