/**
 * Text field view - Exact copy of Keystone implementation with ShadCN UI
 */

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldContainer } from '@/components/ui/field-container'
import { FieldLabel } from '@/components/ui/field-label'
import { FieldDescription } from '@/components/ui/field-description'
import { entriesTyped } from '../../lib/entriesTyped'

// Types matching Keystone exactly
type InnerTextValue = { kind: 'null'; prev: string } | { kind: 'value'; value: string }
type TextValue =
  | { kind: 'create'; inner: InnerTextValue }
  | { kind: 'update'; inner: InnerTextValue; initial: InnerTextValue }

type Validation = {
  match: { regex: RegExp; explanation: string | null } | null
  length: { min: number | null; max: number | null }
}

interface FieldProps {
  field: {
    path: string
    label: string
    description?: string
    displayMode: 'input' | 'textarea'
    isNullable: boolean
    validation: Validation
  }
  value: TextValue
  onChange?: (value: TextValue) => void
  autoFocus?: boolean
  forceValidation?: boolean
  isRequired?: boolean
}

interface CellProps {
  item: Record<string, any>
  field: any
  linkTo?: { href: string }
}

// Validation function - exact copy from Keystone
function validate(
  value: TextValue,
  validation: Validation,
  isRequired: boolean,
  fieldLabel: string
): string[] {
  // if the value is the same as the initial for an update, we don't want to block saving
  // since we're not gonna send it anyway if it's the same
  // and going "fix this thing that is unrelated to the thing you're doing" is bad
  // and also bc it could be null bc of read access control
  if (
    value.kind === 'update' &&
    ((value.initial.kind === 'null' && value.inner.kind === 'null') ||
      (value.initial.kind === 'value' &&
        value.inner.kind === 'value' &&
        value.inner.value === value.initial.value))
  ) {
    return []
  }

  if (value.inner.kind === 'null') {
    if (isRequired) return [`${fieldLabel} is required`]
    return []
  }

  const val = value.inner.value
  const min = Math.max(validation.length.min ?? 0, isRequired ? 1 : 0)
  const messages: string[] = []
  if (val.length < min) {
    if (min === 1) {
      messages.push(`${fieldLabel} must not be empty`)
    } else {
      messages.push(`${fieldLabel} must be at least ${min} characters long`)
    }
  }
  if (validation.length.max !== null && val.length > validation.length.max) {
    messages.push(`${fieldLabel} must be no longer than ${validation.length.max} characters`)
  }
  if (validation.match && !validation.match.regex.test(val)) {
    messages.push(
      validation.match.explanation || `${fieldLabel} must match ${validation.match.regex}`
    )
  }
  return messages
}

// Deserialize function - exact copy from Keystone
function deserializeTextValue(value: string | null): InnerTextValue {
  if (value === null) return { kind: 'null', prev: '' }
  return { kind: 'value', value }
}

// Simple NullableFieldWrapper - just like Keystone's structure
function NullableFieldWrapper({
  isAllowed,
  autoFocus,
  isReadOnly,
  isNull,
  onChange,
  children,
  errorMessage,
}: {
  isAllowed: boolean
  autoFocus?: boolean
  isReadOnly?: boolean
  isNull: boolean
  onChange: () => void
  children: React.ReactNode
  errorMessage?: string
}) {
  return (
    <div className="space-y-2">
      {children}
      {errorMessage && (
        <div className="text-sm text-red-600" role="alert">
          {errorMessage}
        </div>
      )}
      {isAllowed && (
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={isNull}
            onCheckedChange={onChange}
            disabled={isReadOnly}
          />
          <Label className="text-sm text-gray-600">
            Set field as null
          </Label>
        </div>
      )}
    </div>
  )
}

// Field component - exact copy from Keystone with ShadCN UI
export function Field(props: FieldProps) {
  const { autoFocus, field, forceValidation, onChange, value, isRequired = false } = props

  const [shouldShowErrors, setShouldShowErrors] = useState(false)
  const validationMessages = validate(value, field.validation, isRequired, field.label)

  const isReadOnly = onChange == null
  const isNull = value.inner.kind === 'null'
  const isTextArea = field.displayMode === 'textarea'
  const FieldComponent = isTextArea ? Textarea : Input

  const errorMessage = !!validationMessages.length && (shouldShowErrors || forceValidation)
    ? validationMessages.join('. ')
    : undefined

  return (
    <FieldContainer>
      <FieldLabel className={errorMessage ? "text-red-600" : ""}>
        {field.label}
      </FieldLabel>
      {field.description && (
        <FieldDescription>{field.description}</FieldDescription>
      )}
      <NullableFieldWrapper
        isAllowed={field.isNullable}
        autoFocus={isNull && autoFocus}
        isReadOnly={isReadOnly}
        isNull={isNull}
        onChange={() => {
          if (!onChange) return

          const inner =
            value.inner.kind === 'value'
              ? ({ kind: 'null', prev: value.inner.value } as const)
              : ({ kind: 'value', value: value.inner.prev } as const)

          onChange({ ...value, inner })
        }}
        errorMessage={errorMessage}
      >
        <FieldComponent
          autoFocus={autoFocus}
          placeholder={field.description}
          disabled={isNull}
          readOnly={isReadOnly}
          required={isRequired}
          aria-invalid={!!errorMessage}
          onBlur={() => {
            setShouldShowErrors(true)
          }}
          onChange={(e: any) => {
            if (!onChange) return
            onChange({
              ...value,
              inner: {
                kind: 'value',
                value: e.target.value,
              },
            })
          }}
          // maintain the previous value when set to null in aid of continuity for
          // the user. it will be cleared when the item is saved
          value={value.inner.kind === 'value' ? value.inner.value : value.inner.prev}
        />
      </NullableFieldWrapper>
    </FieldContainer>
  )
}

// Cell component for list view
export function Cell({ item, field }: CellProps) {
  const value = item[field.path]
  return (
    <span className="text-sm">
      {value || <span className="text-gray-400">—</span>}
    </span>
  )
}

// CardValue component
export function CardValue({ item, field }: CellProps) {
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-gray-600">{item[field.path] || '—'}</div>
    </div>
  )
}

// Controller function - exact copy from Keystone
export const controller = (config: {
  path: string
  label: string
  description?: string
  fieldMeta: {
    displayMode: 'input' | 'textarea'
    isNullable: boolean
    defaultValue: string | null
    validation: {
      length: { min: number | null; max: number | null }
      match: { regex: RegExp; explanation: string | null } | null
    }
    shouldUseModeInsensitive?: boolean
  }
}) => {
  const validation: Validation = {
    length: config.fieldMeta.validation.length,
    match: config.fieldMeta.validation.match
      ? {
          regex: new RegExp(
            config.fieldMeta.validation.match.regex.source,
            config.fieldMeta.validation.match.regex.flags
          ),
          explanation: config.fieldMeta.validation.match.explanation,
        }
      : null,
  }

  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    defaultValue: { kind: 'create' as const, inner: deserializeTextValue(config.fieldMeta.defaultValue) },
    displayMode: config.fieldMeta.displayMode,
    isNullable: config.fieldMeta.isNullable,
    deserialize: (data: any) => {
      const inner = deserializeTextValue(data[config.path])
      return { kind: 'update' as const, inner, initial: inner }
    },
    serialize: (value: TextValue) => ({ [config.path]: value.inner.kind === 'null' ? null : value.inner.value }),
    validation,
    validate: (val: TextValue, opts: { isRequired: boolean }) => validate(val, validation, opts.isRequired, config.label).length === 0,
    filter: {
      Filter: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search..."
        />
      ),
      Label: ({ label, value }: { label: string; value: string }) => {
        const trimmedLabel = label.toLowerCase().replace(' exactly', '')
        return `${trimmedLabel} "${value}"`
      },
      graphql: ({ type, value }: { type: string; value: string }) => {
        const isNot = type.startsWith('not_')
        const key =
          type === 'is_i' || type === 'not_i'
            ? 'equals'
            : type
                .replace(/_i$/, '')
                .replace('not_', '')
                .replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())
        
        const baseFilter = { 
          [key]: value,
          ...(config.fieldMeta.shouldUseModeInsensitive ? { mode: 'insensitive' } : {})
        }
        
        return {
          [config.path]: isNot ? { not: baseFilter } : baseFilter,
        }
      },
      parseGraphQL: (value: any) => {
        return entriesTyped(value).flatMap(([type, value]) => {
          if (!value) return []
          if (type === 'equals') return { type: 'is_i', value }
          if (type === 'contains') return { type: 'contains_i', value }
          if (type === 'startsWith') return { type: 'starts_with_i', value }
          if (type === 'endsWith') return { type: 'ends_with_i', value }
          if (type === 'not') {
            if (value?.equals) return { type: 'not_i', value: value.equals }
            if (value?.contains) return { type: 'not_contains_i', value: value.contains }
            if (value?.startsWith) return { type: 'not_starts_with_i', value: value.startsWith }
            if (value?.endsWith) return { type: 'not_ends_with_i', value: value.endsWith }
          }
          return []
        })
      },
      types: {
        contains_i: {
          label: 'Contains',
          initialValue: '',
        },
        not_contains_i: {
          label: 'Does not contain',
          initialValue: '',
        },
        is_i: {
          label: 'Is exactly',
          initialValue: '',
        },
        not_i: {
          label: 'Is not exactly',
          initialValue: '',
        },
        starts_with_i: {
          label: 'Starts with',
          initialValue: '',
        },
        not_starts_with_i: {
          label: 'Does not start with',
          initialValue: '',
        },
        ends_with_i: {
          label: 'Ends with',
          initialValue: '',
        },
        not_ends_with_i: {
          label: 'Does not end with',
          initialValue: '',
        },
      },
    },
  }
}

// Cell supports link capability
Cell.supportsLinkTo = true