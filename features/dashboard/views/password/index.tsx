/**
 * Password field view - Keystone implementation with Shadcn UI
 */

import React, { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldContainer } from '@/components/ui/field-container'
import { FieldLabel } from '@/components/ui/field-label'
import { FieldDescription } from '@/components/ui/field-description'
import { Eye, EyeOff, Asterisk } from 'lucide-react'
import type {
  FieldController,
  FieldControllerConfig,
  FieldProps,
} from '../../types'

// Types matching Keystone exactly
type Value =
  | {
      kind: 'initial'
      isSet: boolean | null
    }
  | {
      kind: 'editing'
      isSet: boolean | null
      value: string
      confirm: string
    }

type Validation = {
  rejectCommon: boolean
  match: {
    regex: RegExp
    explanation: string
  } | null
  length: {
    min: number
    max: number | null
  }
}

export type PasswordFieldMeta = {
  isNullable: boolean
  validation: {
    rejectCommon: boolean
    match: {
      regex: { source: string; flags: string }
      explanation: string
    } | null
    length: {
      min: number
      max: number | null
    }
  }
}

interface PasswordFieldProps {
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
  value?: boolean | null
}

// Validation function - exact copy from Keystone
function validate(
  value: Value,
  validation: Validation,
  isRequired: boolean,
  fieldLabel: string
): string | undefined {
  if (value.kind === 'initial' && (value.isSet === null || value.isSet === true)) {
    return undefined
  }
  if (value.kind === 'initial' && isRequired) {
    return `${fieldLabel} is required`
  }
  if (value.kind === 'editing' && value.confirm !== value.value) {
    return `The passwords do not match`
  }
  if (value.kind === 'editing') {
    const val = value.value
    if (val.length < validation.length.min) {
      if (validation.length.min === 1) {
        return `${fieldLabel} must not be empty`
      }
      return `${fieldLabel} must be at least ${validation.length.min} characters long`
    }
    if (validation.length.max !== null && val.length > validation.length.max) {
      return `${fieldLabel} must be no longer than ${validation.length.max} characters`
    }
    if (validation.match && !validation.match.regex.test(val)) {
      return validation.match.explanation
    }
    // Skip dumb-passwords check for now since we don't have that dependency
  }
  return undefined
}

export function Field({
  field,
  value,
  onChange,
  autoFocus,
  forceValidation,
  isRequired = false,
}: PasswordFieldProps) {
  const [secureTextEntry, setSecureTextEntry] = useState(true)
  const [touched, setTouched] = useState({ value: false, confirm: false })
  const triggerRef = useRef<HTMLButtonElement>(null)

  const isReadOnly = onChange == null
  const validationMessage =
    forceValidation || (touched.value && touched.confirm)
      ? validate(value, field.validation, isRequired, field.label)
      : undefined

  const cancelEditing = () => {
    onChange?.({ kind: 'initial', isSet: value.isSet })
    setTimeout(() => {
      triggerRef.current?.focus()
    }, 0)
  }

  const onEscape = (e: React.KeyboardEvent) => {
    if (e.key !== 'Escape' || value.kind !== 'editing') return
    if (value.value === '' && value.confirm === '') {
      cancelEditing()
    }
  }

  // Reset when the user cancels, or when the form is submitted
  useEffect(() => {
    if (value.kind === 'initial') {
      setTouched({ value: false, confirm: false })
      setSecureTextEntry(true)
    }
  }, [value.kind])

  if (isReadOnly) {
    const isIndeterminate = value.isSet == null
    const isSelected = value.isSet == null ? undefined : value.isSet

    return (
      <FieldContainer>
        <FieldLabel>{field.label}</FieldLabel>
        {field.description && (
          <FieldDescription>{field.description}</FieldDescription>
        )}
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={isSelected}
            disabled
            className="opacity-50"
          />
          <Label className="text-sm text-muted-foreground">
            {isIndeterminate ? 'Access denied' : 'Value is set'}
          </Label>
        </div>
      </FieldContainer>
    )
  }

  if (value.kind === 'initial') {
    return (
      <FieldContainer>
        <FieldLabel>{field.label}</FieldLabel>
        {field.description && (
          <FieldDescription>{field.description}</FieldDescription>
        )}
        <div>
          <Button
            ref={triggerRef}
            variant="outline"
            autoFocus={autoFocus}
            onClick={() => {
              onChange?.({
                kind: 'editing',
                confirm: '',
                value: '',
                isSet: value.isSet,
              })
            }}
          >
            {value.isSet ? `Change ` : `Set `}
            {field.label.toLowerCase()}
          </Button>
        </div>
      </FieldContainer>
    )
  }

  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      {field.description && (
        <FieldDescription>{field.description}</FieldDescription>
      )}
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            autoFocus
            placeholder="New password"
            type={secureTextEntry ? 'password' : 'text'}
            value={value.value}
            required={isRequired}
            className={validationMessage ? 'border-red-500' : ''}
            onBlur={() => setTouched({ ...touched, value: true })}
            onChange={(e) => onChange?.({ ...value, value: e.target.value })}
            onKeyDown={onEscape}
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder="Confirm password"
            type={secureTextEntry ? 'password' : 'text'}
            value={value.confirm}
            className={validationMessage ? 'border-red-500' : ''}
            onBlur={() => setTouched({ ...touched, confirm: true })}
            onChange={(e) => onChange?.({ ...value, confirm: e.target.value })}
            onKeyDown={onEscape}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setSecureTextEntry(bool => !bool)}
            title={secureTextEntry ? 'Show password' : 'Hide password'}
          >
            {secureTextEntry ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={cancelEditing}
          >
            Cancel
          </Button>
        </div>
      </div>
      
      {validationMessage && (
        <p className="text-sm text-red-600" role="alert">{validationMessage}</p>
      )}
    </FieldContainer>
  )
}

export function Cell({ item, field, value }: CellProps) {
  const fieldValue = value ?? item[field.path]?.isSet
  return fieldValue ? (
    <div className="flex items-center" aria-label="is set">
      <Asterisk className="h-3 w-3" />
      <Asterisk className="h-3 w-3" />
      <Asterisk className="h-3 w-3" />
    </div>
  ) : (
    <span className="sr-only">not set</span>
  )
}

export function CardValue({ item, field }: CellProps) {
  const value = item[field.path]?.isSet
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-muted-foreground">
        {value ? (
          <div className="flex items-center gap-1">
            <Asterisk className="h-3 w-3" />
            <Asterisk className="h-3 w-3" />
            <Asterisk className="h-3 w-3" />
            <span className="ml-1">Set</span>
          </div>
        ) : (
          'Not set'
        )}
      </div>
    </div>
  )
}

export function controller(
  config: FieldControllerConfig<PasswordFieldMeta>
): FieldController<Value> & {
  validation: Validation
} {
  const validation: Validation = {
    ...config.fieldMeta?.validation || { rejectCommon: false, match: null, length: { min: 1, max: null } },
    match:
      config.fieldMeta?.validation?.match === null || config.fieldMeta?.validation?.match === undefined
        ? null
        : {
            regex: new RegExp(
              config.fieldMeta.validation.match.regex.source,
              config.fieldMeta.validation.match.regex.flags
            ),
            explanation: config.fieldMeta.validation.match.explanation,
          },
  }

  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: `${config.path} { isSet }`,
    validation,
    defaultValue: {
      kind: 'initial',
      isSet: false,
    },
    validate: (state, opts) =>
      validate(state, validation, opts.isRequired, config.label) === undefined,
    deserialize: data => ({ 
      kind: 'initial', 
      isSet: data[config.path]?.isSet ?? null 
    }),
    serialize: value => {
      if (value.kind === 'initial') return {}
      return { [config.path]: value.value }
    },
  }
}

Cell.supportsLinkTo = false