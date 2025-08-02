/**
 * Float field view - Keystone implementation with Shadcn UI
 */

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  min: number | null
  max: number | null
}

interface FloatFieldProps {
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

// Validation function - exact copy from Keystone
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
  const v = parseFloat(input)
  if (Number.isNaN(v)) return `${label} is not a valid float`
  if (validation.min != null && v < validation.min)
    return `${label} must be greater than or equal to ${validation.min}`
  if (validation.max != null && v > validation.max)
    return `${label} must be less than or equal to ${validation.max}`
}

export function Field({
  field,
  value,
  onChange,
  autoFocus,
  forceValidation,
  isRequired = false,
}: FloatFieldProps) {
  const [isDirty, setDirty] = useState(false)
  const isReadOnly = !onChange

  const validate = (value: Value) => {
    return validate_(value, field.validation, isRequired, field.label)
  }

  const errorMessage = (forceValidation || isDirty) && validate(value)

  return (
    <div className="space-y-2">
      <Label>{field.label}</Label>
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
        className={errorMessage ? 'border-red-500' : ''}
      />
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      {errorMessage && (
        <p className="text-sm text-red-600" role="alert">{errorMessage}</p>
      )}
    </div>
  )
}

export function Cell({ item, field }: CellProps) {
  const value = item[field.path]
  return (
    <span className="text-sm font-mono">
      {value !== null && value !== undefined ? 
        Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 }) : 
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
          Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 }) : 
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
    serialize: value => {
      const v = value.value !== null ? parseFloat(value.value) : null
      return { [config.path]: Number.isFinite(v) ? v : null }
    },
    validate: (value, opts) => validate(value, opts) === undefined,
    filter: {
      Filter: ({ value, onChange, type, autoFocus }: any) => {
        const [isDirty, setDirty] = useState(false)
        if (type === 'empty' || type === 'not_empty') return null

        return (
          <Input
            type="number"
            step="any"
            inputMode="decimal"
            autoFocus={autoFocus}
            value={value ?? ''}
            onBlur={() => setDirty(true)}
            onChange={(e) => {
              const inputValue = e.target.value === '' ? null : e.target.value
              onChange(inputValue)
            }}
            placeholder="Enter number..."
          />
        )
      },
      graphql: ({ type, value }: { type: string; value: string }) => {
        if (type === 'empty') return { [config.path]: { equals: null } }
        if (type === 'not_empty') return { [config.path]: { not: { equals: null } } }
        const val = value === null ? null : parseFloat(value)
        if (type === 'not') return { [config.path]: { not: { equals: val } } }
        return { [config.path]: { [type]: val } }
      },
      parseGraphQL: (value: any) => {
        return entriesTyped(value).flatMap(([type, value]) => {
          if (type === 'equals' && value === null) {
            return [{ type: 'empty', value: null }]
          }
          if (!value) return []
          if (type === 'equals') return { type: 'equals', value: (value as any).toString() }
          if (type === 'not') {
            if ((value as any).equals === null) return { type: 'not_empty', value: null }
            if ((value as any).equals === undefined) return []
            return { type: 'not', value: (value as any).equals.toString() }
          }
          if (type === 'gt' || type === 'gte' || type === 'lt' || type === 'lte') {
            return { type, value: (value as any).toString() }
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
        equals: { label: 'Is exactly', initialValue: '' },
        not: { label: 'Is not exactly', initialValue: '' },
        gt: { label: 'Is greater than', initialValue: '' },
        lt: { label: 'Is less than', initialValue: '' },
        gte: { label: 'Is greater than or equal to', initialValue: '' },
        lte: { label: 'Is less than or equal to', initialValue: '' },
        empty: { label: 'Is empty', initialValue: '' },
        not_empty: { label: 'Is not empty', initialValue: '' },
      } as any,
    } as any,
  }
}

Cell.supportsLinkTo = false