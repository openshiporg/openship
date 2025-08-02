/**
 * useCreateItem hook - Manages item creation state and operations
 * Based on Keystone's useCreateItem but adapted for Dashboard 2's SWR patterns
 */

import { useState, useMemo, useCallback } from 'react'
import { serializeValueToOperationItem } from './useHasChanges'
import { createItemAction } from '../actions/item-actions'

interface CreateItemError {
  networkError?: Error
  graphQLErrors?: Array<{ message: string; path?: string[] }>
}

interface CreateItemState {
  state: 'idle' | 'loading' | 'error' | 'success'
  error: CreateItemError | null
  value: Record<string, any>
  invalidFields: Set<string>
  forceValidation: boolean
}

export function useCreateItem(list: any, enhancedFields: Record<string, any>, options?: { skipRevalidation?: boolean }) {
  if (!list || !enhancedFields) return null

  const [state, setState] = useState<CreateItemState>({
    state: 'idle',
    error: null,
    value: {},
    invalidFields: new Set(),
    forceValidation: false
  })

  // Initialize default values for the form using enhanced fields
  const defaultValue = useMemo(() => {
    const value: Record<string, any> = {}
    
    // Initialize each field with its default value from the controller
    Object.entries(enhancedFields).forEach(([key, field]: [string, any]) => {
      if (field.controller?.defaultValue !== undefined) {
        value[key] = field.controller.defaultValue
      }
    })
    
    return value
  }, [enhancedFields])

  // Update state value
  const onChange = useCallback((newValue: Record<string, any>) => {
    setState(prev => ({ ...prev, value: newValue }))
  }, [])

  // Validate fields using enhanced fields
  const validate = useCallback(() => {
    const invalidFields = new Set<string>()
    
    Object.entries(enhancedFields).forEach(([key, field]: [string, any]) => {
      const isRequired = field.createView?.isRequired || false
      const value = state.value[key]
      
      // Basic required field validation
      if (isRequired && (value === undefined || value === null || value === '')) {
        invalidFields.add(key)
      }
      
      // Field-specific validation using controller
      if (field.controller?.validate) {
        const isValid = field.controller.validate(value, { isRequired })
        if (!isValid) {
          invalidFields.add(key)
        }
      }
    })
    
    return invalidFields
  }, [enhancedFields, state.value])

  // Create item function
  const create = useCallback(async () => {
    setState(prev => ({ ...prev, state: 'loading', error: null }))
    
    // Validate before creating
    const invalidFields = validate()
    if (invalidFields.size > 0) {
      setState(prev => ({ 
        ...prev, 
        state: 'error',
        invalidFields,
        forceValidation: true,
        error: { graphQLErrors: [{ message: 'Please fix validation errors' }] }
      }))
      return null
    }

    try {
      // Serialize the value for GraphQL mutation using enhanced fields
      const data = serializeValueToOperationItem('create', enhancedFields, state.value)
      
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
  }, [enhancedFields, state.value, validate])

  // Props for the Fields component - using enhanced fields
  const props = useMemo(() => ({
    view: 'createView' as const,
    position: 'form' as const,
    list,
    fields: enhancedFields,
    groups: list.groups || [],
    value: { ...defaultValue, ...state.value },
    onChange,
    forceValidation: state.forceValidation,
    invalidFields: state.invalidFields,
    isRequireds: Object.fromEntries(
      Object.entries(enhancedFields).map(([key, field]: [string, any]) => [
        key, 
        field.createView?.isRequired || false
      ])
    )
  }), [
    list,
    enhancedFields, 
    list.groups, 
    defaultValue, 
    state.value, 
    state.forceValidation, 
    state.invalidFields, 
    onChange
  ])

  return {
    state: state.state,
    error: state.error,
    props,
    create
  }
}