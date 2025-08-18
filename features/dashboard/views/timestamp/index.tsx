/**
 * Timestamp field view - Keystone implementation with ShadCN UI
 */

'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FieldContainer } from '@/components/ui/field-container'
import { FieldLabel } from '@/components/ui/field-label'
import { FieldDescription } from '@/components/ui/field-description'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { entriesTyped } from '../../lib/entriesTyped'
import type {
  FieldController,
  FieldControllerConfig,
  FieldProps,
} from '../../types'

export type Value =
  | {
      kind: 'create'
      value: string | null
    }
  | {
      kind: 'update'
      value: string | null
      initial: string | null
    }

export type TimestampFieldMeta = {
  defaultValue: string | { kind: 'now' } | null
  updatedAt: boolean
}

interface TimestampFieldProps {
  field: {
    path: string
    label: string
    description?: string
    fieldMeta: TimestampFieldMeta
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

function validate(
  value: Value,
  fieldMeta: TimestampFieldMeta,
  isRequired: boolean,
  label: string
): string | undefined {
  const isEmpty = !value.value

  // if we receive null initially on the item view and the current value is null,
  // we should always allow saving it because:
  // - the value might be null in the database and we don't want to prevent saving the whole item because of that
  // - we might have null because of an access control error
  if (value.kind === 'update' && value.initial === null && isEmpty) return

  if (
    value.kind === 'create' &&
    isEmpty &&
    ((typeof fieldMeta.defaultValue === 'object' && fieldMeta.defaultValue?.kind === 'now') ||
      fieldMeta.updatedAt)
  )
    return

  if (isRequired && isEmpty) return `${label} is required`

  return
}

export function Field({
  field,
  value,
  onChange,
  autoFocus,
  forceValidation,
  isRequired = false,
}: TimestampFieldProps) {
  const [isDirty, setDirty] = useState(false)
  const isReadOnly = !onChange

  const showValidation = isDirty || forceValidation
  const validationMessage = showValidation
    ? validate(value, field.fieldMeta, isRequired, field.label)
    : undefined

  const dateValue = value.value ? new Date(value.value) : undefined

  if (isReadOnly) {
    return (
      <FieldContainer>
        <FieldLabel>{field.label}</FieldLabel>
        {field.description && (
          <FieldDescription>{field.description}</FieldDescription>
        )}
        <Input
          readOnly
          tabIndex={-1}
          value={
            dateValue
              ? dateValue.toLocaleString()
              : 'yyyy-mm-dd --:--:--'
          }
          className="bg-muted cursor-default"
          onFocus={(e) => e.target.blur()}
        />
      </FieldContainer>
    )
  }

  return (
    <FieldContainer>
      <FieldLabel className={validationMessage ? "text-red-600" : ""}>
        {field.label}
      </FieldLabel>
      {field.description && (
        <FieldDescription>{field.description}</FieldDescription>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal",
              !dateValue && "text-muted-foreground",
              validationMessage && "border-red-500"
            )}
            autoFocus={autoFocus}
            onBlur={() => setDirty(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateValue ? format(dateValue, "PPP p") : <span>Pick a date and time</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) => {
              if (date && onChange) {
                // Preserve existing time if date has one, otherwise use current time
                const existingDate = dateValue
                if (existingDate) {
                  // Keep the existing time when changing date
                  date.setHours(existingDate.getHours(), existingDate.getMinutes(), existingDate.getSeconds(), existingDate.getMilliseconds())
                } else {
                  // Set time to current time if not set
                  const now = new Date()
                  date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0)
                }
                onChange({ ...value, value: date.toISOString() })
              } else if (!date && onChange) {
                onChange({ ...value, value: null })
              }
              setDirty(true)
            }}
            initialFocus
          />
          {dateValue && (
            <div className="p-3 border-t">
              <Label className="text-sm">Time</Label>
              <Input
                type="time"
                step="1"
                value={dateValue ? format(dateValue, "HH:mm:ss") : ""}
                onChange={(e) => {
                  if (onChange && dateValue) {
                    const timeValue = e.target.value
                    if (timeValue) {
                      const [hours, minutes, seconds] = timeValue.split(':').map(Number)
                      const newDate = new Date(dateValue)
                      newDate.setHours(hours, minutes || 0, seconds || 0, 0)
                      onChange({ ...value, value: newDate.toISOString() })
                      setDirty(true)
                    }
                  }
                }}
                className="mt-1 shadow-xs"
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
      {validationMessage && (
        <div className="text-sm text-red-600" role="alert">{validationMessage}</div>
      )}
    </FieldContainer>
  )
}

export function Cell({ item, field }: CellProps) {
  const value = item[field.path]
  return (
    <span className="text-sm">
      {value ? format(new Date(value), "MMM d, yyyy p") : <span className="text-muted-foreground">—</span>}
    </span>
  )
}

export function CardValue({ item, field }: CellProps) {
  const value = item[field.path]
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-muted-foreground">
        {value ? format(new Date(value), "MMM d, yyyy p") : '—'}
      </div>
    </div>
  )
}

export function controller(config: FieldControllerConfig<TimestampFieldMeta>): FieldController<
  Value,
  string | null
> & {
  fieldMeta: TimestampFieldMeta
} {
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    fieldMeta: config.fieldMeta,
    defaultValue: {
      kind: 'create',
      value:
        typeof config.fieldMeta.defaultValue === 'string' ? config.fieldMeta.defaultValue : null,
    },
    deserialize: (data: any) => {
      const value = data[config.path]
      return {
        kind: 'update',
        initial: data[config.path],
        value: value ?? null,
      }
    },
    serialize: ({ value }) => {
      if (value) return { [config.path]: value }
      return { [config.path]: null }
    },
    validate: (value, opts) =>
      validate(value, config.fieldMeta, opts.isRequired, config.label) === undefined,
    filter: {
      Filter: ({ value, onChange, type, autoFocus }: any) => {
        const [isDirty, setDirty] = useState(false)

        if (type === 'empty' || type === 'not_empty') return null
        const dateValue = value ? new Date(value) : undefined

        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "justify-start text-left font-normal",
                  !dateValue && "text-muted-foreground"
                )}
                autoFocus={autoFocus}
                onBlur={() => setDirty(true)}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue ? format(dateValue, "PPP p") : <span>Pick a date and time</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) => {
                  if (date) {
                    // Preserve existing time if date has one, otherwise use current time
                    const existingDate = dateValue
                    if (existingDate) {
                      // Keep the existing time when changing date
                      date.setHours(existingDate.getHours(), existingDate.getMinutes(), existingDate.getSeconds(), existingDate.getMilliseconds())
                    } else {
                      // Set time to current time if not set
                      const now = new Date()
                      date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0)
                    }
                    onChange(date.toISOString())
                  } else {
                    onChange(null)
                  }
                  setDirty(true)
                }}
                initialFocus
              />
              {dateValue && (
                <div className="p-3 border-t">
                  <Label className="text-sm">Time</Label>
                  <Input
                    type="time"
                    step="1"
                    value={dateValue ? format(dateValue, "HH:mm:ss") : ""}
                    onChange={(e) => {
                      if (dateValue) {
                        const timeValue = e.target.value
                        if (timeValue) {
                          const [hours, minutes, seconds] = timeValue.split(':').map(Number)
                          const newDate = new Date(dateValue)
                          newDate.setHours(hours, minutes || 0, seconds || 0, 0)
                          onChange(newDate.toISOString())
                          setDirty(true)
                        }
                      }
                    }}
                    className="mt-1 shadow-xs"
                  />
                </div>
              )}
            </PopoverContent>
          </Popover>
        )
      },
      graphql: ({ type, value }: { type: string; value: string }) => {
        if (type === 'empty') return { [config.path]: { equals: null } }
        if (type === 'not_empty') return { [config.path]: { not: { equals: null } } }
        if (type === 'not') return { [config.path]: { not: { equals: value } } }
        return { [config.path]: { [type]: value } }
      },
      parseGraphQL: (value: any) => {
        return entriesTyped(value).flatMap(([type, value]) => {
          if (type === 'equals' && value === null) {
            return { type: 'empty', value: null }
          }
          if (!value) return []
          if (type === 'equals') return { type: 'equals', value: value as unknown as string }
          if (type === 'not') {
            if (value?.equals === null) return { type: 'not_empty', value: null }
            return { type: 'not', value: value.equals as unknown as string }
          }
          if (type === 'gt' || type === 'lt') {
            return { type, value: value as unknown as string }
          }
          return []
        })
      },
      Label: ({ label, type, value }: { label: string; type: string; value: string }) => {
        if (type === 'empty' || type === 'not_empty' || value == null) {
          return label.toLowerCase()
        }

        return `${label.toLowerCase()} ${format(new Date(value), "MMM d, yyyy p")}`
      },
      types: {
        equals: {
          label: 'Is exactly',
          initialValue: null,
        },
        not: {
          label: 'Is not exactly',
          initialValue: null,
        },
        lt: {
          label: 'Is before',
          initialValue: null,
        },
        gt: {
          label: 'Is after',
          initialValue: null,
        },
        empty: {
          label: 'Is empty',
          initialValue: null,
        },
        not_empty: {
          label: 'Is not empty',
          initialValue: null,
        },
      },
    },
  }
}

Cell.supportsLinkTo = false