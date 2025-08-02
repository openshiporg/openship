/**
 * useHasChanges - EXACT copy from Keystone
 */

import { useMemo } from 'react'
import isDeepEqual from 'fast-deep-equal'

export function makeDefaultValueState(fields: Record<string, any>) {
  const result: Record<string, unknown> = {}
  for (const fieldKey in fields) {
    result[fieldKey] = fields[fieldKey].controller.defaultValue
  }
  return result
}

export function serializeValueToOperationItem(
  operation: 'create' | 'update',
  fields: Record<string, any>,
  value: Record<string, unknown>,
  valueReference?: Record<string, unknown>
) {
  const result: Record<string, unknown> = {}
  valueReference ??= makeDefaultValueState(fields)

  for (const fieldKey in fields) {
    const field = fields[fieldKey]

    const fieldValue = value[fieldKey]
    const fieldValueSerialized = field.controller.serialize(fieldValue)

    const fieldValueReference = valueReference[fieldKey]

    const isAlwaysRequired = field.graphql?.isNonNull?.includes(operation) ?? false
    if (!isAlwaysRequired) {
      if (isDeepEqual(fieldValueSerialized, field.controller.serialize(fieldValueReference)))
        continue
    }

    Object.assign(result, fieldValueSerialized)
  }

  return result
}

export function useHasChanges(
  operation: 'create' | 'update',
  fields: Record<string, any>,
  value: Record<string, unknown>,
  valueReference?: Record<string, unknown>
) {
  return useMemo(() => {
    const alwaysRequiredCount = Object.values(fields).filter((f: any) =>
      f.graphql?.isNonNull?.includes(operation) ?? false
    ).length

    const itemForUpdate = serializeValueToOperationItem(operation, fields, value, valueReference)

    // add any fields that are always required
    return Object.keys(itemForUpdate).length - alwaysRequiredCount > 0
  }, [fields, operation, value, valueReference])
}