/**
 * Decimal field view - Keystone implementation with ShadCN UI
 */

'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { FieldContainer } from '@/components/ui/field-container'
import { FieldLabel } from '@/components/ui/field-label'
import { FieldDescription } from '@/components/ui/field-description'
import { entriesTyped } from '../../lib/entriesTyped'
import type {
  FieldController,
  FieldControllerConfig,
  FieldProps,
} from '../../types'

const TYPE_OPERATOR_MAP = {
  equals: '=',
  not: '≠',
  gt: '>',
  lt: '<',
  gte: '≥',
  lte: '≤',
} as const

// Types matching Keystone exactly
type Value =
  | { kind: 'create'; value: string | null }
  | { kind: 'update'; initial: string | null; value: string | null }

type Validation = {
  min: string | null
  max: string | null
}

interface DecimalFieldProps {
  field: {
    path: string
    label: string
    description?: string
    validation: Validation
  }
  value: Value
  onChange?: (value: Value) => void
  autoFocus?: boolean
  forceValidation?: boolean
  isRequired?: boolean
}

interface CellProps {
  item: Record<string, any>
  field: any
}

// Simple decimal validation (without full Decimal.js library)
function validateDecimal(input: string): { isValid: boolean; number?: number; error?: string } {
  try {
    const num = parseFloat(input)
    if (isNaN(num) || !isFinite(num)) {
      return { isValid: false, error: 'Not a valid decimal number' }
    }
    return { isValid: true, number: num }
  } catch (e) {
    return { isValid: false, error: 'Invalid decimal format' }
  }
}

// Validation function - adapted from Keystone
function validate_(
  value: Value,
  validation: Validation,
  isRequired: boolean,
  label: string
): string | undefined {
  const { value: input, kind } = value
  if (kind === 'update' && (value as any).initial === null && input === null) return
  if (isRequired && input === null) return `${label} is required`
  if (typeof input !== 'string') return
  
  const { isValid, number, error } = validateDecimal(input)
  if (!isValid) return `${label}: ${error}`
  
  if (validation.min && number! < parseFloat(validation.min))
    return `${label} must be greater than or equal to ${validation.min}`
  if (validation.max && number! > parseFloat(validation.max))
    return `${label} must be less than or equal to ${validation.max}`
}

export function Field({
  field,
  value,
  onChange,
  autoFocus,
  forceValidation,
  isRequired = false,
}: DecimalFieldProps) {
  const [isDirty, setDirty] = useState(false)
  const isReadOnly = !onChange

  const validate = (value: Value) => {
    return validate_(value, field.validation, isRequired, field.label)
  }

  const errorMessage = (forceValidation || isDirty) && validate(value)

  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      {field.description && (
        <FieldDescription>{field.description}</FieldDescription>
      )}
      <Input
        type="number"
        step="any"
        inputMode="decimal"
        autoFocus={autoFocus}
        readOnly={isReadOnly}
        required={isRequired}
        onBlur={() => setDirty(true)}
        onChange={(e) => {
          if (!onChange) return
          const inputValue = e.target.value === '' ? null : e.target.value
          onChange({ ...value, value: inputValue })
        }}
        value={value.value ?? ''}
        className={errorMessage ? 'border-red-500 shadow-xs' : 'shadow-xs'}
        placeholder="Enter decimal number..."
      />
      {errorMessage && (
        <p className="text-sm text-red-600" role="alert">{errorMessage}</p>
      )}
    </FieldContainer>
  )
}

export function Cell({ item, field }: CellProps) {
  const value = item[field.path]
  return (
    <span className="text-sm font-mono">
      {value !== null && value !== undefined ? 
        Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 10 }) : 
        <span className="text-muted-foreground">—</span>
      }
    </span>
  )
}

export function CardValue({ item, field }: CellProps) {
  const value = item[field.path]
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-muted-foreground font-mono">
        {value !== null && value !== undefined ? 
          Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 10 }) : 
          '—'
        }
      </div>
    </div>
  )
}

export function controller(
  config: FieldControllerConfig<{
    validation: Validation
    defaultValue: string | null
  }>
): FieldController<Value> & {
  validation: Validation
} {
  const validate = (value: Value, opts: { isRequired: boolean }) => {
    return validate_(value, config.fieldMeta?.validation || { min: null, max: null }, opts.isRequired, config.label)
  }

  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    validation: config.fieldMeta?.validation || { min: null, max: null },
    defaultValue: { kind: 'create', value: config.fieldMeta?.defaultValue || null },
    deserialize: data => ({ kind: 'update', value: data[config.path], initial: data[config.path] }),
    serialize: value => ({ [config.path]: value.value }),
    validate: (value, opts) => validate(value, opts) === undefined,
    filter: {
      Filter: ({ value, onChange, type, autoFocus }: any) => {
        if (type === 'empty' || type === 'not_empty') return null

        return (
          <Input
            type="number"
            step="any"
            inputMode="decimal"
            autoFocus={autoFocus}
            value={value ?? ''}
            onChange={(e) => {
              const inputValue = e.target.value === '' ? null : e.target.value
              onChange(inputValue)
            }}
            placeholder="Enter decimal number..."
          />
        )
      },
      graphql: ({ type, value }: { type: string; value: string }) => {
        if (type === 'empty') return { [config.path]: { equals: null } }
        if (type === 'not_empty') return { [config.path]: { not: { equals: null } } }
        if (type === 'not') return { [config.path]: { not: { equals: value } } }
        return { [config.path]: { [type]: value } }
      },
      // @ts-ignore - Type issues with filter implementation  
      parseGraphQL: (value: any) => {
        return entriesTyped(value).flatMap(([type, value]) => {
          if (type === 'equals' && value === null) {
            return [{ type: 'empty', value: null }]
          }
          if (!value) return []
          if (type === 'equals') return { type: 'equals', value: value as unknown as string }
          if (type === 'not') {
            if (value?.equals === null) return { type: 'not_empty', value: null }
            if (value?.equals === undefined) return []
            return { type: 'not', value: value.equals as unknown as string }
          }
          if (type === 'gt' || type === 'gte' || type === 'lt' || type === 'lte') {
            return { type, value: value as unknown as string }
          }
          return []
        })
      },
      Label: ({ label, type, value }: { label: string; type: string; value: string }) => {
        if (type === 'empty' || type === 'not_empty') return label.toLowerCase()
        const operator = TYPE_OPERATOR_MAP[type as keyof typeof TYPE_OPERATOR_MAP]
        return `${operator} ${value}`
      },
      types: {
        // @ts-ignore
        equals: { label: 'Is exactly', initialValue: null },
        // @ts-ignore
        not: { label: 'Is not exactly', initialValue: null },
        // @ts-ignore
        gt: { label: 'Is greater than', initialValue: null },
        // @ts-ignore
        lt: { label: 'Is less than', initialValue: null },
        // @ts-ignore
        gte: { label: 'Is greater than or equal to', initialValue: null },
        // @ts-ignore
        lte: { label: 'Is less than or equal to', initialValue: null },
        // @ts-ignore
        empty: { label: 'Is empty', initialValue: null },
        // @ts-ignore
        not_empty: { label: 'Is not empty', initialValue: null },
      },
    },
  }
}

Cell.supportsLinkTo = false