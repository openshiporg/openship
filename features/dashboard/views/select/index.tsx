/**
 * Select field view - Keystone implementation with Shadcn UI
 */

import React, { useMemo, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldContainer } from '@/components/ui/field-container'
import { FieldLabel } from '@/components/ui/field-label'
import { FieldDescription } from '@/components/ui/field-description'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { entriesTyped } from '../../lib/entriesTyped'
import type {
  FieldController,
  FieldControllerConfig,
  FieldProps,
} from '../../types'

// Types matching Keystone exactly
type Option = { label: string; value: string }

const FILTER_TYPES = {
  matches: {
    label: 'Matches',
    initialValue: [] as string[],
  },
  not_matches: {
    label: 'Does not match',
    initialValue: [] as string[],
  },
}
type Value =
  | { value: Option | null; kind: 'create' }
  | { value: Option | null; initial: Option | null; kind: 'update' }

interface SelectFieldProps {
  field: {
    path: string
    label: string
    description?: string
    options: Option[]
    displayMode: 'select' | 'segmented-control' | 'radio'
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
  value?: string
}

// Validation function
function validate(value: Value, isRequired: boolean) {
  if (isRequired) {
    // if you got null initially on the update screen, we want to allow saving
    // since the user probably doesn't have read access control
    if (value.kind === 'update' && value.initial === null) return true
    return value.value !== null
  }
  return true
}

// Simple NullableFieldWrapper
function NullableFieldWrapper({
  isAllowed,
  autoFocus,
  label,
  isReadOnly,
  isNull,
  onChange,
  children,
}: {
  isAllowed: boolean
  autoFocus?: boolean
  label: string
  isReadOnly?: boolean
  isNull: boolean
  onChange: (isChecked: boolean) => void
  children: React.ReactNode
}) {
  if (!isAllowed) {
    return <>{children}</>
  }

  return (
    <div className="space-y-2">
      {children}
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={isNull}
          onCheckedChange={onChange}
          disabled={isReadOnly}
          autoFocus={autoFocus}
        />
        <Label className="text-sm text-muted-foreground">
          Set field as null
        </Label>
      </div>
    </div>
  )
}

export function Field({
  field,
  value,
  onChange,
  autoFocus,
  forceValidation,
  isRequired = false,
}: SelectFieldProps) {
  const [isDirty, setDirty] = useState(false)
  const [preNullValue, setPreNullValue] = useState(
    value.value || (value.kind === 'update' ? value.initial : null)
  )

  const selectedKey = value.value?.value || preNullValue?.value || null
  const isNullable = !isRequired
  const isNull = isNullable && value.value?.value == null
  const isInvalid = !validate(value, isRequired)
  const isReadOnly = onChange == null
  const errorMessage =
    isInvalid && (isDirty || forceValidation) ? `${field.label} is required.` : undefined

  const onSelectionChange = (key: string) => {
    if (!onChange) return

    const newValue: Value['value'] = field.options.find(opt => opt.value === key) ?? null

    onChange({ ...value, value: newValue })
    setDirty(true)
  }

  const onNullChange = (isChecked: boolean) => {
    if (!onChange) return

    if (isChecked) {
      onChange({ ...value, value: null })
      setPreNullValue(value.value)
    } else {
      onChange({ ...value, value: preNullValue || field.options[0] })
    }
    setDirty(true)
  }

  const fieldElement = (() => {
    switch (field.displayMode) {
      case 'radio':
        return (
          <div className="space-y-2">
            <FieldLabel>{field.label}</FieldLabel>
            {field.description && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
            <RadioGroup
              disabled={isNull || isReadOnly}
              required={isRequired}
              onValueChange={onSelectionChange}
              value={value.value?.value ?? preNullValue?.value ?? ''}
            >
              {field.options.map(item => (
                <div key={item.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={item.value} id={item.value} />
                  <Label htmlFor={item.value}>{item.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {errorMessage && (
              <p className="text-sm text-red-600" role="alert">{errorMessage}</p>
            )}
          </div>
        )
      default:
        return (
          <div className="space-y-2">
            <FieldLabel>{field.label}</FieldLabel>
            {field.description && (
              <FieldDescription>{field.description}</FieldDescription>
            )}
            <Select
              disabled={isNull || isReadOnly}
              required={isRequired}
              onValueChange={onSelectionChange}
              value={selectedKey || ''}
            >
              <SelectTrigger className={errorMessage ? 'border-red-500 shadow-xs' : 'shadow-xs'}>
                <SelectValue placeholder="Select an option..." />
              </SelectTrigger>
              <SelectContent>
                {field.options.map(item => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errorMessage && (
              <p className="text-sm text-red-600" role="alert">{errorMessage}</p>
            )}
          </div>
        )
    }
  })()

  return (
    <FieldContainer>
      <NullableFieldWrapper
        isAllowed={!isRequired}
        autoFocus={isNull && autoFocus}
        label={field.label}
        isReadOnly={isReadOnly}
        isNull={isNull}
        onChange={onNullChange}
      >
        {fieldElement}
      </NullableFieldWrapper>
    </FieldContainer>
  )
}

export function Cell({ item, field, value }: CellProps) {
  const fieldValue = value ?? item[field.path]
  const option = field.fieldMeta.options?.find((x: Option) => x.value === fieldValue)
  return (
    <div>
      {option ? (
        <div>{option.label}</div>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </div>
  )
}

export function CardValue({ item, field }: CellProps) {
  const value = item[field.path]
  const option = field.options?.find((x: Option) => x.value === value)
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-muted-foreground">
        {option ? option.label : '—'}
      </div>
    </div>
  )
}

type AdminSelectFieldMeta = {
  options: { label: string; value: string | number }[]
  type: 'string' | 'integer' | 'enum'
  displayMode: 'select' | 'segmented-control' | 'radio'
  defaultValue: string | number | null
}

type Config = FieldControllerConfig<AdminSelectFieldMeta>

export function controller(config: Config): FieldController<Value, string[]> & {
  options: Option[]
  type: 'string' | 'integer' | 'enum'
  displayMode: 'select' | 'segmented-control' | 'radio'
} {
  const optionsWithStringValues = config.fieldMeta?.options?.map(x => ({
    label: x.label,
    value: x.value.toString(),
  })) || []

  // Transform from string value to type appropriate value
  const t = (v: string | null) =>
    v === null ? null : config.fieldMeta?.type === 'integer' ? parseInt(v) : v

  const stringifiedDefault = config.fieldMeta?.defaultValue?.toString()

  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    defaultValue: {
      kind: 'create',
      value: optionsWithStringValues.find(x => x.value === stringifiedDefault) ?? null,
    },
    type: config.fieldMeta?.type || 'string',
    displayMode: config.fieldMeta?.displayMode || 'select',
    options: optionsWithStringValues,
    deserialize: data => {
      for (const option of config.fieldMeta?.options || []) {
        if (option.value === data[config.path]) {
          const stringifiedOption = { label: option.label, value: option.value.toString() }
          return {
            kind: 'update',
            initial: stringifiedOption,
            value: stringifiedOption,
          }
        }
      }
      return { kind: 'update', initial: null, value: null }
    },
    serialize: value => ({ [config.path]: t(value.value?.value ?? null) }),
    validate: (value, opts) => validate(value, opts.isRequired),
    filter: {
      Filter: ({ value, onChange, type }: any) => {
        const selectedValues = new Set(value || [])
        
        return (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {optionsWithStringValues.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedValues.has(option.value)}
                  onCheckedChange={(checked) => {
                    const newSelection = new Set(selectedValues)
                    if (checked) {
                      newSelection.add(option.value)
                    } else {
                      newSelection.delete(option.value)
                    }
                    onChange(Array.from(newSelection))
                  }}
                />
                <Label className="text-sm">{option.label}</Label>
              </div>
            ))}
          </div>
        )
      },
      graphql: ({ type, value: options }: { type: string; value: string[] }) => ({
        [config.path]: {
          [type === 'not_matches' ? 'notIn' : 'in']: options.map(x => t(x)),
        },
      }),
      parseGraphQL: (value: any) => {
        return entriesTyped(value).flatMap(([type, value]) => {
          if (type === 'equals' && value != null) {
            return { type: 'matches', value: [value] }
          }
          if (type === 'notIn' || type === 'in') {
            if (!value) return []
            return {
              type: type === 'notIn' ? 'not_matches' : 'matches',
              value: value.filter((x: any) => x != null),
            }
          }
          return []
        })
      },
      Label: ({ type, value }: { type: string; value: string[] }) => {
        if (value.length === 0) {
          return type === 'not_matches' ? `is set` : `is not set`
        }
        const values = new Set(value)
        const labels = optionsWithStringValues
          .filter(opt => values.has(opt.value))
          .map(i => i.label)
        const prefix = type === 'not_matches' ? `is not` : `is`

        if (value.length === 1) return `${prefix} ${labels[0]}`
        if (value.length === 2) return `${prefix} ${labels.join(' or ')}`
        return `${prefix} ${labels[0]} and ${value.length - 1} more`
      },
      types: FILTER_TYPES,
    },
  }
}

Cell.supportsLinkTo = false