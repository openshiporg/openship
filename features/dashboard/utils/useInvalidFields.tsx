/**
 * useInvalidFields hook - Exact copy from Keystone
 * Determines which fields are invalid based on validation rules
 */

import { useMemo } from 'react'
import { testFilter } from '../components/Fields'

export function useInvalidFields(
  fields: Record<string, any>,
  item: Record<string, unknown>,
  isRequireds: Record<string, any>
): ReadonlySet<string> {
  return useMemo(() => {
    const invalidFields = new Set<string>()

    // First, serialize all field values to get the current form state
    const serialized: Record<string, unknown> = {}
    for (const [fieldKey, field] of Object.entries(fields)) {
      // Only serialize fields that exist in the item - prevents undefined errors
      // This matches Keystone's pattern where all fields have values from makeDefaultValueState
      if (item[fieldKey] !== undefined && field.controller && field.controller.serialize) {
        try {
          Object.assign(serialized, field.controller.serialize(item[fieldKey]))
        } catch (error) {
          console.error(`Error serializing field ${fieldKey}:`, error)
        }
      }
    }

    // Then validate each field
    for (const fieldKey in item) {
      const field = fields[fieldKey]
      const validateFn = field?.controller?.validate
      if (!validateFn) continue
      
      const isRequired = testFilter(isRequireds[fieldKey] ?? false, serialized)
      const fieldValue = item[fieldKey]
      
      try {
        const valid = validateFn(fieldValue, { isRequired })
        if (!valid) {
          invalidFields.add(fieldKey)
        }
      } catch (error) {
        console.error(`Error validating field ${fieldKey}:`, error)
        // If validation throws, consider it invalid
        invalidFields.add(fieldKey)
      }
    }
    
    return invalidFields
  }, [fields, isRequireds, item])
}