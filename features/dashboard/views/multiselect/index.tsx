/**
 * Multi-select field view - Keystone implementation with ShadCN UI Multiple Selector
 */

import React from 'react'
import { FieldContainer } from '@/components/ui/field-container'
import { FieldLabel } from '@/components/ui/field-label'
import { FieldDescription } from '@/components/ui/field-description'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import MultipleSelector, { type Option } from '@/components/ui/multiple-selector'
import { entriesTyped } from '../../lib/entriesTyped'
import type {
  FieldController,
  FieldControllerConfig,
} from '../../types'

// Types matching Keystone exactly
export type AdminMultiSelectFieldMeta = {
  options: { label: string; value: string | number }[]
  type: 'string' | 'integer' | 'enum'
  defaultValue: string[] | number[]
}

type Config = FieldControllerConfig<AdminMultiSelectFieldMeta>
type KeystoneOption = { label: string; value: string }
type Value = readonly KeystoneOption[]

interface MultiSelectFieldProps {
  field: {
    path: string
    label: string
    description?: string
    options: KeystoneOption[]
    type: 'string' | 'integer' | 'enum'
    valuesToOptionsWithStringValues: Record<string, KeystoneOption>
  }
  value: Value
  onChange?: (value: Value) => void
  autoFocus?: boolean
}

interface CellProps {
  item: Record<string, any>
  field: {
    path: string
    label: string
    fieldMeta?: {
      options?: { label: string; value: string | number }[]
      type?: 'string' | 'integer' | 'enum'
    }
  }
  linkTo?: { href: string }
}

export function Field({ field, value, onChange, autoFocus }: MultiSelectFieldProps) {
  const isReadOnly = onChange == null

  // Convert Keystone options to MultipleSelector format
  const selectorOptions: Option[] = field.options.map(option => ({
    value: option.value,
    label: option.label,
  }))

  // Convert Keystone value to MultipleSelector format
  const selectorValue: Option[] = value.map(option => ({
    value: option.value,
    label: option.label,
  }))

  const handleChange = (newOptions: Option[]) => {
    if (!onChange) return
    
    // Convert back to Keystone format
    const keystoneValue: Value = newOptions.map(option => ({
      value: option.value,
      label: option.label,
    }))
    
    onChange(keystoneValue)
  }

  return (
    <FieldContainer>
      <FieldLabel htmlFor={field.path}>{field.label}</FieldLabel>
      {field.description && (
        <FieldDescription id={`${field.path}-description`}>
          {field.description}
        </FieldDescription>
      )}
      <MultipleSelector
        value={selectorValue}
        options={selectorOptions}
        onChange={handleChange}
        placeholder="Select options..."
        disabled={isReadOnly}
        emptyIndicator={
          <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
            No results found.
          </p>
        }
        hideClearAllButton={false}
        className="w-full"
      />
    </FieldContainer>
  )
}

export function Cell({ item, field, linkTo }: CellProps) {
  const value: readonly string[] | readonly number[] = item[field.path] ?? []
  
  // Build options mapping from field meta if not provided
  const optionsWithStringValues = field.fieldMeta?.options?.map(x => ({
    label: x.label,
    value: x.value.toString(),
  })) || []
  
  const valuesToOptionsWithStringValues = Object.fromEntries(
    optionsWithStringValues.map(option => [option.value, option])
  )
  
  const labels = value
    .map(value => valuesToOptionsWithStringValues[value]?.label || value)
  
  if (labels.length === 0) {
    return (
      <span className="text-sm">
        <span className="text-gray-400">—</span>
      </span>
    )
  }

  const displayLabels = labels.length < 3 ? labels : labels.slice(0, 2)
  const overflow = labels.length < 3 ? 0 : labels.length - 2
  
  return (
    <span className="text-sm">
      {displayLabels.join(', ')}
      {overflow > 0 && (
        <span className="opacity-50 font-medium">
          {`, and ${overflow} more`}
        </span>
      )}
    </span>
  )
}

export function CardValue({ item, field }: CellProps) {
  const value: readonly string[] | readonly number[] = item[field.path] ?? []
  
  // Build options mapping from field meta if not provided
  const optionsWithStringValues = field.fieldMeta?.options?.map(x => ({
    label: x.label,
    value: x.value.toString(),
  })) || []
  
  const valuesToOptionsWithStringValues = Object.fromEntries(
    optionsWithStringValues.map(option => [option.value, option])
  )
  
  const labels = value
    .map(value => valuesToOptionsWithStringValues[value]?.label || value)
  
  if (labels.length === 0) {
    return (
      <div>
        <div className="text-sm font-medium">{field.label}</div>
        <div className="text-sm text-gray-600">—</div>
      </div>
    )
  }

  const displayLabels = labels.length < 3 ? labels : labels.slice(0, 2)
  const overflow = labels.length < 3 ? 0 : labels.length - 2

  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-gray-600">
        {displayLabels.join(', ')}
        {overflow > 0 && (
          <span className="opacity-50 font-medium">
            {`, and ${overflow} more`}
          </span>
        )}
      </div>
    </div>
  )
}

export const controller = (
  config: Config
): FieldController<Value, string[]> & {
  options: KeystoneOption[]
  type: 'string' | 'integer' | 'enum'
  valuesToOptionsWithStringValues: Record<string, KeystoneOption>
} => {
  const optionsWithStringValues = config.fieldMeta?.options?.map(x => ({
    label: x.label,
    value: x.value.toString(),
  })) || []

  const valuesToOptionsWithStringValues = Object.fromEntries(
    optionsWithStringValues.map(option => [option.value, option])
  )

  const parseValue = (value: string) =>
    config.fieldMeta?.type === 'integer' ? parseInt(value) : value

  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    defaultValue: config.fieldMeta?.defaultValue?.map(x => valuesToOptionsWithStringValues[x]) || [],
    type: config.fieldMeta?.type || 'string',
    options: optionsWithStringValues,
    valuesToOptionsWithStringValues,
    deserialize: data => {
      // if we get null from the GraphQL API (which will only happen if field read access control failed)
      // we'll just show it as nothing being selected for now.
      const values: readonly string[] | readonly number[] = data[config.path] ?? []
      const selectedOptions = values.map(x => valuesToOptionsWithStringValues[x]).filter(Boolean)
      return selectedOptions
    },
    serialize: value => ({ [config.path]: value.map(x => parseValue(x.value)) }),
    validate: () => true,
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
          [type === 'not_matches' ? 'notIn' : 'in']: options.map(x => parseValue(x)),
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
      types: {
        matches: {
          label: 'Matches',
          initialValue: [] as string[],
        },
        not_matches: {
          label: 'Does not match',
          initialValue: [] as string[],
        },
      },
    },
  }
}

Cell.supportsLinkTo = true