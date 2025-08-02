/**
 * Integer field view - Keystone implementation with Shadcn UI
 */

'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import { entriesTyped } from '../../lib/entriesTyped'
import type {
  FieldController,
  FieldControllerConfig,
  FieldProps,
} from '../../types'

// Types matching Keystone exactly
type Value =
  | { kind: 'create'; value: number | null }
  | { kind: 'update'; initial: number | null; value: number | null }

type Validation = {
  min: number
  max: number
}

interface IntegerFieldProps {
  field: {
    path: string
    label: string
    description?: string
    validation: Validation
    hasAutoIncrementDefault: boolean
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
  label: string,
  hasAutoIncrementDefault: boolean
): string | undefined {
  const { value: input, kind } = value
  if (kind === 'create' && hasAutoIncrementDefault && input === null) return
  if (kind === 'update' && (value as any).initial === null && input === null) return
  if (isRequired && input === null) return `${label} is required`
  if (typeof input !== 'number') return
  const v = input
  if (!Number.isInteger(v)) return `${label} is not a valid integer`
  if (validation.min !== undefined && v < validation.min)
    return `${label} must be greater than or equal to ${validation.min}`
  if (validation.max !== undefined && v > validation.max)
    return `${label} must be less than or equal to ${validation.max}`
}

export function Field({
  field,
  value,
  onChange,
  autoFocus,
  forceValidation,
  isRequired = false,
}: IntegerFieldProps) {
  const [isDirty, setDirty] = useState(false)
  const isReadOnly = !onChange || field.hasAutoIncrementDefault

  if (field.hasAutoIncrementDefault && value.kind === 'create') {
    return (
      <div className="space-y-2">
        <Label>{field.label}</Label>
        <Input
          readOnly
          value="Auto increment"
          className="bg-muted"
        />
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This field is set to auto increment. It will default to the next available number.
          </AlertDescription>
        </Alert>
        {field.description && (
          <p className="text-sm text-muted-foreground">{field.description}</p>
        )}
      </div>
    )
  }

  const validate = (value: Value) => {
    return validate_(
      value,
      field.validation,
      isRequired,
      field.label,
      field.hasAutoIncrementDefault
    )
  }

  const errorMessage = (forceValidation || isDirty) && validate(value)

  return (
    <div className="space-y-2">
      <Label>{field.label}</Label>
      <Input
        type="number"
        step="1"
        autoFocus={autoFocus}
        readOnly={isReadOnly}
        required={isRequired}
        onBlur={() => setDirty(true)}
        onChange={(e) => {
          if (!onChange) return
          const numValue = e.target.value === '' ? null : Number(e.target.value)
          onChange({ ...value, value: !Number.isFinite(numValue) ? null : numValue })
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
      {value !== null && value !== undefined ? value.toString() : <span className="text-muted-foreground">—</span>}
    </span>
  )
}

export function CardValue({ item, field }: CellProps) {
  const value = item[field.path]
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-muted-foreground font-mono">
        {value !== null && value !== undefined ? value.toString() : '—'}
      </div>
    </div>
  )
}

export function controller(
  config: FieldControllerConfig<{
    validation: Validation
    defaultValue: number | null | 'autoincrement'
  }>
): FieldController<Value> & {
  validation: Validation
  hasAutoIncrementDefault: boolean
} {
  const validate = (value: Value, opts: { isRequired: boolean }) => {
    return validate_(
      value,
      config.fieldMeta?.validation || { min: -Infinity, max: Infinity },
      opts.isRequired,
      config.label,
      config.fieldMeta?.defaultValue === 'autoincrement'
    )
  }

  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    validation: config.fieldMeta?.validation || { min: -Infinity, max: Infinity },
    defaultValue: {
      kind: 'create',
      value:
        config.fieldMeta?.defaultValue === 'autoincrement' ? null : config.fieldMeta?.defaultValue ?? null,
    },
    deserialize: data => ({ kind: 'update', value: data[config.path], initial: data[config.path] }),
    serialize: value => ({ [config.path]: value.value }),
    hasAutoIncrementDefault: config.fieldMeta?.defaultValue === 'autoincrement',
    validate: (value, opts) => validate(value, opts) === undefined,
    filter: {
      Filter: ({ value, onChange, type, autoFocus }: any) => {
        const [isDirty, setDirty] = useState(false)
        if (type === 'empty' || type === 'not_empty') return null

        return (
          <Input
            type="number"
            step="1"
            autoFocus={autoFocus}
            value={value ?? ''}
            onBlur={() => setDirty(true)}
            onChange={(e) => {
              const numValue = e.target.value === '' ? null : Number(e.target.value)
              onChange(!Number.isFinite(numValue) ? null : numValue)
            }}
            placeholder="Enter number..."
          />
        )
      },
      graphql: ({ type, value }: { type: string; value: number }) => {
        if (type === 'empty') return { [config.path]: { equals: null } }
        if (type === 'not_empty') return { [config.path]: { not: { equals: null } } }
        if (type === 'not') return { [config.path]: { not: { equals: value } } }
        return { [config.path]: { [type]: value } }
      },
      parseGraphQL: (value: any) => {
        return entriesTyped(value).flatMap(([type, value]) => {
          if (type === 'equals' && value === null) {
            return [{ type: 'empty', value: null }]
          }
          if (!value) return []
          if (type === 'equals') return { type: 'equals', value }
          if (type === 'not') {
            if (value?.equals === null) return { type: 'not_empty', value: null }
            if (value?.equals === undefined) return []
            return { type: 'not', value: value.equals }
          }
          if (type === 'gt' || type === 'gte' || type === 'lt' || type === 'lte') {
            return { type, value }
          }
          return []
        })
      },
      Label: ({ label, type, value }: { label: string; type: string; value: number }) => {
        if (type === 'empty' || type === 'not_empty') return label.toLowerCase()
        const TYPE_OPERATOR_MAP = {
          equals: '=',
          not: '≠',
          gt: '>',
          lt: '<',
          gte: '≥',
          lte: '≤',
        } as const
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