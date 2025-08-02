import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldContainer } from '@/components/ui/field-container'
import { FieldLabel } from '@/components/ui/field-label'
import { FieldDescription } from '@/components/ui/field-description'

import type {
  FieldController,
  FieldControllerConfig,
  FieldProps,
} from '../../types'
import { entriesTyped } from '../../lib/entriesTyped'

const TYPE_OPERATOR_MAP = {
  equals: '=',
  not: '≠',
  gt: '>',
  lt: '<',
  gte: '≥',
  lte: '≤',
} as const

type Value =
  | { kind: 'create'; value: string | null }
  | { kind: 'update'; initial: string | null; value: string | null }

type Validation = {
  min: string
  max: string
}

function validate_(
  value: Value,
  validation: Validation,
  isRequired: boolean,
  label: string,
  hasAutoIncrementDefault: boolean
): string | undefined {
  const { value: input, kind } = value
  if (kind === 'create' && hasAutoIncrementDefault && input === null) return
  if (kind === 'update' && value.initial === null && input === null) return
  if (isRequired && input === null) return `${label} is required`
  if (typeof input !== 'string') return
  try {
    const v = BigInt(input)
    if (validation.min !== undefined && v < BigInt(validation.min))
      return `${label} must be greater than or equal to ${validation.min}`
    if (validation.max !== undefined && v > BigInt(validation.max))
      return `${label} must be less than or equal to ${validation.max}`
  } catch (e: any) {
    return `${label} is not a valid BigInt`
  }
}

export function controller(
  config: FieldControllerConfig<{
    validation: Validation
    defaultValue: string | null | 'autoincrement'
  }>
): FieldController<Value, string | null> & {
  validation: Validation
  hasAutoIncrementDefault: boolean
} {
  const validate = (value: Value, opts: { isRequired: boolean }) => {
    return validate_(
      value,
      config.fieldMeta.validation,
      opts.isRequired,
      config.label,
      config.fieldMeta.defaultValue === 'autoincrement'
    )
  }

  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    validation: config.fieldMeta.validation,
    defaultValue: {
      kind: 'create',
      value:
        config.fieldMeta.defaultValue === 'autoincrement' ? null : config.fieldMeta.defaultValue,
    },
    deserialize: data => ({ kind: 'update', value: data[config.path], initial: data[config.path] }),
    serialize: value => ({ [config.path]: value.value }),
    filter: {
      Filter(props) {
        const {
          autoFocus,
          context,
          forceValidation,
          typeLabel,
          onChange,
          type,
          value,
          ...otherProps
        } = props
        const [isDirty, setDirty] = useState(false)
        if (type === 'empty' || type === 'not_empty') return null

        const labelProps =
          context === 'add' ? { label: config.label, description: typeLabel } : { label: typeLabel }

        return (
          <div className="space-y-2">
            <Label htmlFor={`bigint-filter-${config.path}`}>
              {labelProps.label}
            </Label>
            <Input
              {...otherProps}
              id={`bigint-filter-${config.path}`}
              autoFocus={autoFocus}
              inputMode="numeric"
              className={
                (forceValidation || isDirty) &&
                !validate({ kind: 'update', initial: null, value }, { isRequired: true })
                  ? 'border-destructive'
                  : ''
              }
              onBlur={() => setDirty(true)}
              onChange={e => onChange?.(e.target.value === '' ? null : e.target.value)}
              value={value ?? ''}
            />
            {(forceValidation || isDirty) &&
              !validate({ kind: 'update', initial: null, value }, { isRequired: true }) && (
                <p className="text-sm text-destructive">Required</p>
              )}
          </div>
        )
      },

      graphql: ({ type, value }) => {
        if (type === 'empty') return { [config.path]: { equals: null } }
        if (type === 'not_empty') return { [config.path]: { not: { equals: null } } }
        if (type === 'not') return { [config.path]: { not: { equals: value } } }
        return { [config.path]: { [type]: value } }
      },
      parseGraphQL: value => {
        return entriesTyped(value).flatMap(([type, value]) => {
          if (type === 'equals' && value === null) {
            return [{ type: 'empty', value: null }]
          }
          if (!value) return []
          if (type === 'equals') return { type: 'equals', value: value as unknown as string }
          if (type === 'not') {
            if ((value as any)?.equals === null) return { type: 'not_empty', value: null }
            return { type: 'not', value: (value as any).equals as unknown as string }
          }
          if (type === 'gt' || type === 'gte' || type === 'lt' || type === 'lte') {
            return { type, value: value as unknown as string }
          }
          return []
        })
      },
      Label({ label, type, value }) {
        if (type === 'empty' || type === 'not_empty') return label.toLocaleLowerCase()
        const operator = TYPE_OPERATOR_MAP[type as keyof typeof TYPE_OPERATOR_MAP]
        return `${operator} ${value}`
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
        gt: {
          label: 'Is greater than',
          initialValue: null,
        },
        lt: {
          label: 'Is less than',
          initialValue: null,
        },
        gte: {
          label: 'Is greater than or equal to',
          initialValue: null,
        },
        lte: {
          label: 'Is less than or equal to',
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

    hasAutoIncrementDefault: config.fieldMeta.defaultValue === 'autoincrement',
    validate: (value, opts) => validate(value, opts) === undefined,
  }
}

export function Field({
  field,
  value,
  onChange,
  autoFocus,
  forceValidation,
  isRequired,
}: FieldProps<typeof controller>) {
  const [isDirty, setDirty] = useState(false)
  const isReadOnly = !onChange || field.hasAutoIncrementDefault

  if (field.hasAutoIncrementDefault && value.kind === 'create') {
    return (
      <FieldContainer>
        <FieldLabel>
          {field.label}
        </FieldLabel>
        {field.description && (
          <FieldDescription>
            {field.description}
          </FieldDescription>
        )}
        <Input
          autoFocus={autoFocus}
          readOnly
          defaultValue="--"
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground mt-1">
          This field is set to auto increment. It will default to the next available number.
        </p>
      </FieldContainer>
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
    <FieldContainer>
      <FieldLabel>
        {field.label}
      </FieldLabel>
      {field.description && (
        <FieldDescription>
          {field.description}
        </FieldDescription>
      )}
      <Input
        autoFocus={autoFocus}
        readOnly={isReadOnly}
        inputMode="numeric"
        className={errorMessage ? 'border-destructive' : ''}
        onBlur={() => setDirty(true)}
        onChange={e => onChange?.({ ...value, value: e.target.value === '' ? null : e.target.value })}
        value={value.value ?? ''}
      />
      {errorMessage && (
        <p className="text-sm text-destructive mt-1">{errorMessage}</p>
      )}
    </FieldContainer>
  )
}

interface CellProps {
  item: Record<string, any>
  field: any
}

export function Cell({ item, field }: CellProps) {
  const value = item[field.path]
  return (
    <span className="text-sm font-mono">
      {value !== null && value !== undefined ? value.toString() : <span className="text-muted-foreground">—</span>}
    </span>
  )
}

Cell.supportsLinkTo = false