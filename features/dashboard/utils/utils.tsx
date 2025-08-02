/**
 * Utility functions for Dashboard 2
 * Based on Keystone's utils implementation from packages/core/src/admin-ui/utils/utils.tsx
 */

import { useMemo, useState, useRef, useEffect } from 'react'

// Type definitions
export type DataGetter = (data: Record<string, any>) => any
export type ItemData = Record<string, any>

/**
 * Deserialize item data to field values
 * Based on Keystone's deserializeItemToValue function
 */
export function deserializeItemToValue(
  item: Record<string, any>,
  fields: Record<string, any>
): Record<string, any> {
  const value: Record<string, any> = {}
  
  Object.keys(fields).forEach(fieldPath => {
    const field = fields[fieldPath]
    const itemValue = item[fieldPath]
    
    // Handle different field types
    if (field.fieldMeta?.kind === 'relation') {
      // Handle relationship fields
      if (field.fieldMeta.many) {
        value[fieldPath] = {
          kind: 'many',
          value: Array.isArray(itemValue) ? itemValue : [],
          initialValue: Array.isArray(itemValue) ? itemValue : []
        }
      } else {
        value[fieldPath] = {
          kind: 'one',
          value: itemValue || null,
          initialValue: itemValue || null
        }
      }
    } else if (field.fieldMeta?.kind === 'password') {
      // Handle password fields
      value[fieldPath] = {
        kind: 'no-change',
        isSet: !!itemValue
      }
    } else if (field.fieldMeta?.kind === 'file' || field.fieldMeta?.kind === 'image') {
      // Handle file/image fields
      value[fieldPath] = itemValue || { src: '', ref: '' }
    } else {
      // Handle primitive fields (text, number, etc.)
      value[fieldPath] = itemValue
    }
  })
  
  return value
}

/**
 * Serialize field values to GraphQL operation format
 * Based on Keystone's serializeValueToOperationItem function
 */
export function serializeValueToOperationItem(
  fields: Record<string, any>,
  value: Record<string, any>
): Record<string, any> {
  const data: Record<string, any> = {}
  
  Object.keys(fields).forEach(fieldPath => {
    const field = fields[fieldPath]
    const fieldValue = value[fieldPath]
    
    if (fieldValue === undefined) return
    
    // Handle different field types
    if (field.fieldMeta?.kind === 'relation') {
      // Handle relationship fields
      if (field.fieldMeta.many) {
        if (fieldValue?.kind === 'many') {
          data[fieldPath] = {
            connect: fieldValue.value?.filter((item: any) => item && item.id).map((item: any) => ({ id: item.id })) || [],
            disconnect: []
          }
        }
      } else {
        if (fieldValue?.kind === 'one') {
          data[fieldPath] = fieldValue.value ? { connect: { id: fieldValue.value.id } } : { disconnect: true }
        }
      }
    } else if (field.fieldMeta?.kind === 'password') {
      // Handle password fields
      if (fieldValue?.kind === 'editing') {
        data[fieldPath] = fieldValue.value
      }
    } else if (field.fieldMeta?.kind === 'file' || field.fieldMeta?.kind === 'image') {
      // Handle file/image fields - only include if changed
      if (fieldValue?.ref) {
        data[fieldPath] = fieldValue
      }
    } else {
      // Handle primitive fields
      data[fieldPath] = fieldValue
    }
  })
  
  return data
}

/**
 * Hook to track if form has changes
 * Based on Keystone's useHasChanges hook
 */
export function useHasChanges(
  initialValue: Record<string, any>,
  currentValue: Record<string, any>
): boolean {
  return useMemo(() => {
    return Object.keys(currentValue).some(fieldPath => {
      const initial = initialValue[fieldPath]
      const current = currentValue[fieldPath]
      
      // Deep comparison for objects
      if (typeof current === 'object' && current !== null && typeof initial === 'object' && initial !== null) {
        return JSON.stringify(initial) !== JSON.stringify(current)
      }
      
      return initial !== current
    })
  }, [initialValue, currentValue])
}

/**
 * Hook for form state management
 * Similar to Keystone's form handling patterns
 */
export function useFormState<T extends Record<string, any>>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const hasChanges = useHasChanges(initialValue, value)
  
  const updateValue = (fieldPath: string, fieldValue: any) => {
    setValue(prev => ({
      ...prev,
      [fieldPath]: fieldValue
    }))
  }
  
  const reset = () => {
    setValue(initialValue)
    setErrors({})
  }
  
  return {
    value,
    setValue,
    updateValue,
    errors,
    setErrors,
    hasChanges,
    reset
  }
}

/**
 * Hook for handling GraphQL data fetching with loading states
 */
export function useQuery<T = any>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: {
    revalidateOnFocus?: boolean
    revalidateOnReconnect?: boolean
  } = {}
) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const mountedRef = useRef(true)
  
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])
  
  const execute = async () => {
    if (!key) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await fetcher()
      if (mountedRef.current) {
        setData(result)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }
  
  useEffect(() => {
    execute()
  }, [key])
  
  return {
    data,
    error,
    isLoading,
    mutate: execute
  }
}

/**
 * Utility for creating GraphQL field selections
 */
export function createFieldSelection(fields: Record<string, any>): string {
  const selections: string[] = ['id']
  
  Object.keys(fields).forEach(fieldPath => {
    const field = fields[fieldPath]
    
    if (field.fieldMeta?.kind === 'relation') {
      // For relations, select id and label field
      selections.push(`${fieldPath} { id ${field.fieldMeta.labelField || 'name'} }`)
    } else {
      selections.push(fieldPath)
    }
  })
  
  return selections.join(' ')
}

/**
 * Utility for handling field validation
 */
export function validateFieldValue(
  field: any,
  value: any
): string | null {
  // Basic validation - extend as needed
  if (field.isRequired && (!value || (typeof value === 'string' && !value.trim()))) {
    return `${field.label} is required`
  }
  
  return null
}

/**
 * Utility for formatting field display values
 */
export function formatFieldValue(
  field: any,
  value: any
): string {
  if (value === null || value === undefined) {
    return '—'
  }
  
  switch (field.fieldMeta?.kind) {
    case 'relation':
      if (field.fieldMeta.many) {
        return Array.isArray(value) ? `${value.length} items` : '0 items'
      } else {
        return value?.[field.fieldMeta.labelField || 'name'] || value?.id || '—'
      }
    case 'datetime':
      return new Date(value).toLocaleString()
    case 'date':
      return new Date(value).toLocaleDateString()
    case 'password':
      return value ? '••••••••' : 'Not set'
    case 'file':
    case 'image':
      return value?.filename || value?.src ? 'File uploaded' : 'No file'
    default:
      return String(value)
  }
}