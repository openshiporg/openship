import { graphql } from '@keystone-6/core'
import { useState } from 'react'
import type { HTMLAttributes, ReactElement, ReactNode } from 'react'
import { isValidURL } from '../isValidURL'
import type {
  BlockFormattingConfig,
  ChildField,
  ConditionalField,
  ComponentBlock,
  ComponentSchema,
  GenericPreviewProps,
  InlineMarksConfig,
  ObjectField,
  RelationshipField,
  FormField,
  ArrayField,
} from './api-shared'
import {
  Form,
  FormControl,
  FormField as FormFieldComp,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox as UiCheckbox } from '@/components/ui/checkbox'

export * from './api-shared'

type InputArgs<T> = {
  value: T
  onChange(value: T): void
  autoFocus: boolean
  forceValidation?: boolean
}

export const fields = {
  text({
    label,
    defaultValue = '',
    displayMode,
  }: {
    label: string
    defaultValue?: string
    displayMode?: 'input' | 'textarea'
  }): FormField<string, undefined> {
    return {
      kind: 'form' as const,
      Input({ value, onChange, autoFocus }: InputArgs<string>) {
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input
                autoFocus={autoFocus}
                value={value}
                onChange={event => {
                  onChange(event.target.value)
                }}
              />
            </FormControl>
          </FormItem>
        )
      },
      options: undefined,
      defaultValue,
      validate(value: unknown) {
        return typeof value === 'string'
      },
      graphql: {
        input: graphql.String,
        output: graphql.field({
          type: graphql.String,
        }),
      },
    }
  },
  integer({
    label,
    defaultValue = 0,
  }: {
    label: string
    defaultValue?: number
  }): FormField<number, undefined> {
    const validate = (value: unknown) => {
      return typeof value === 'number' && Number.isFinite(value)
    }
    return {
      kind: 'form' as const,
      Input({ value, onChange, autoFocus, forceValidation }: InputArgs<number>) {
        const [blurred, setBlurred] = useState(false)
        const [inputValue, setInputValue] = useState(String(value))
        const showValidation = forceValidation || (blurred && !validate(value))
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input
                onBlur={() => setBlurred(true)}
                autoFocus={autoFocus}
                value={inputValue}
                onChange={event => {
                  const raw = event.target.value
                  setInputValue(raw)
                  if (/^[+-]?\d+$/.test(raw)) {
                    onChange(Number(raw))
                  } else {
                    onChange(NaN)
                  }
                }}
              />
            </FormControl>
            {showValidation && <FormMessage>Please specify an integer</FormMessage>}
          </FormItem>
        )
      },
      options: undefined,
      defaultValue,
      validate,
      graphql: {
        input: graphql.Int,
        output: graphql.field({ type: graphql.Int }),
      },
    }
  },
  url({
    label,
    defaultValue = '',
  }: {
    label: string
    defaultValue?: string
  }): FormField<string, undefined> {
    const validate = (value: unknown) => {
      return typeof value === 'string' && (value === '' || isValidURL(value))
    }
    return {
      kind: 'form' as const,
      Input({ value, onChange, autoFocus, forceValidation }: InputArgs<string>) {
        const [blurred, setBlurred] = useState(false)
        const showValidation = forceValidation || (blurred && !validate(value))
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input
                onBlur={() => setBlurred(true)}
                autoFocus={autoFocus}
                value={value}
                onChange={event => {
                  onChange(event.target.value)
                }}
              />
            </FormControl>
            {showValidation && <FormMessage>Please provide a valid URL</FormMessage>}
          </FormItem>
        )
      },
      options: undefined,
      defaultValue,
      validate,
      graphql: {
        input: graphql.String,
        output: graphql.field({ type: graphql.String }),
      },
    }
  },
  select<const Option extends { label: string; value: string }>({
    label,
    options,
    defaultValue,
  }: {
    label: string
    options: readonly Option[]
    defaultValue: Option['value']
  }): FormField<Option['value'], readonly Option[]> {
    const optionValuesSet = new Set(options.map(x => x.value))
    if (!optionValuesSet.has(defaultValue))
      throw new Error(
        `A defaultValue of ${defaultValue} was provided to a select field but it does not match the value of one of the options provided`
      )
    return {
      kind: 'form' as const,
      Input({ value, onChange, autoFocus }: InputArgs<string>) {
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <Select
              value={value}
              onValueChange={onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )
      },
      options,
      defaultValue,
      validate(value: unknown) {
        return typeof value === 'string' && optionValuesSet.has(value)
      },
      graphql: {
        input: graphql.String,
        output: graphql.field({
          type: graphql.String,
          resolve({ value }) {
            return value
          },
        }),
      },
    }
  },
  multiselect<const Option extends { label: string; value: string }>({
    label,
    options,
    defaultValue,
  }: {
    label: string
    options: readonly Option[]
    defaultValue: readonly Option['value'][]
  }): FormField<readonly Option['value'][], readonly Option[]> {
    const valuesToOption = new Map(options.map(x => [x.value, x]))
    return {
      kind: 'form' as const,
      Input({ value, onChange, autoFocus }: InputArgs<readonly Option['value'][]>) {
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="space-y-2">
              {options.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <UiCheckbox
                    id={option.value}
                    checked={value.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onChange([...value, option.value])
                      } else {
                        onChange(value.filter(v => v !== option.value))
                      }
                    }}
                  />
                  <label
                    htmlFor={option.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </FormItem>
        )
      },
      options,
      defaultValue,
      validate(value: unknown) {
        return (
          Array.isArray(value) &&
          value.every(value => typeof value === 'string' && valuesToOption.has(value))
        )
      },
      graphql: {
        input: graphql.list(graphql.nonNull(graphql.String)),
        output: graphql.field({
          type: graphql.list(graphql.nonNull(graphql.String)),
          resolve({ value }) {
            return value
          },
        }),
      },
    }
  },
  checkbox({
    label,
    defaultValue = false,
  }: {
    label: string
    defaultValue?: boolean
  }): FormField<boolean, undefined> {
    return {
      kind: 'form' as const,
      Input({ value, onChange, autoFocus }: InputArgs<boolean>) {
        return (
          <FormItem>
            <div className="flex items-center space-x-2">
              <FormControl>
                <UiCheckbox
                  checked={value}
                  onCheckedChange={onChange}
                  autoFocus={autoFocus}
                />
              </FormControl>
              <FormLabel>{label}</FormLabel>
            </div>
          </FormItem>
        )
      },
      options: undefined,
      defaultValue,
      validate(value: unknown) {
        return typeof value === 'boolean'
      },
      graphql: {
        input: graphql.Boolean,
        output: graphql.field({ type: graphql.Boolean }),
      },
    }
  },
  empty() {
    return {
      kind: 'form' as const,
      Input() {
        return null
      },
      options: undefined,
      defaultValue: null,
      validate(value: unknown) {
        return value === null || value === undefined
      },
    }
  },
  child(
    options:
      | {
          kind: 'block'
          placeholder: string
          formatting?: BlockFormattingConfig | 'inherit'
          dividers?: 'inherit'
          links?: 'inherit'
          relationships?: 'inherit'
          componentBlocks?: 'inherit'
        }
      | {
          kind: 'inline'
          placeholder: string
          formatting?:
            | 'inherit'
            | {
                inlineMarks?: InlineMarksConfig
                softBreaks?: 'inherit'
              }
          links?: 'inherit'
          relationships?: 'inherit'
        }
  ): ChildField {
    return {
      kind: 'child' as const,
      options:
        options.kind === 'block'
          ? {
              kind: 'block' as const,
              placeholder: options.placeholder,
              dividers: options.dividers,
              formatting:
                options.formatting === 'inherit'
                  ? {
                      blockTypes: 'inherit',
                      headingLevels: 'inherit',
                      inlineMarks: 'inherit',
                      listTypes: 'inherit',
                      alignment: 'inherit',
                      softBreaks: 'inherit',
                    }
                  : options.formatting,
              links: options.links,
              relationships: options.relationships,
              componentBlocks: options.componentBlocks,
            }
          : {
              kind: 'inline' as const,
              placeholder: options.placeholder,
              formatting:
                options.formatting === 'inherit'
                  ? { inlineMarks: 'inherit', softBreaks: 'inherit' }
                  : options.formatting,
              links: options.links,
              relationships: options.relationships,
            },
    }
  },
  object<Fields extends Record<string, ComponentSchema>>(fields: Fields) {
    return {
      kind: 'object' as const,
      fields,
    }
  },
  conditional<
    DiscriminantField extends { defaultValue: any },
    ConditionalValues extends {
      [Key in `${DiscriminantField['defaultValue']}`]: ComponentSchema
    },
  >(
    discriminant: DiscriminantField,
    values: ConditionalValues
  ): ConditionalField<DiscriminantField, ConditionalValues> {
    return {
      kind: 'conditional' as const,
      discriminant,
      values,
    }
  },
  relationship<Many extends boolean | undefined = false>({
    listKey,
    selection,
    label,
    many,
  }: {
    listKey: string
    label: string
    selection?: string
  } & (Many extends undefined | false ? { many?: Many } : { many: Many })): RelationshipField<
    Many extends true ? true : false
  > {
    return {
      kind: 'relationship' as const,
      listKey,
      selection,
      label,
      many: (many ? true : false) as any,
    }
  },
  array<ElementField extends ComponentSchema>(
    element: ElementField,
    opts?: {
      itemLabel?: (props: GenericPreviewProps<ElementField, unknown>) => string
      label?: string
    }
  ): ArrayField<ElementField> {
    return {
      kind: 'array' as const,
      element,
      itemLabel: opts?.itemLabel,
      label: opts?.label,
    }
  },
}

export type PreviewProps<Schema extends ComponentSchema> = GenericPreviewProps<Schema, ReactNode>

export type PreviewPropsForToolbar<Schema extends ComponentSchema> = GenericPreviewProps<
  Schema,
  undefined
>

export function component<
  Schema extends {
    [Key in any]: ComponentSchema
  },
>(
  options: {
    /** The preview component shown in the editor */
    preview: (props: PreviewProps<ObjectField<Schema>>) => ReactElement | null
    /** The schema for the props that the preview component, toolbar and rendered component will receive */
    schema: Schema
    /** The label to show in the insert menu and chrome around the block if chromeless is false */
    label: string
  } & (
    | {
        chromeless: true
        toolbar?: (props: {
          props: PreviewPropsForToolbar<ObjectField<Schema>>
          onRemove(): void
        }) => ReactElement
      }
    | {
        chromeless?: false
        toolbar?: (props: {
          props: PreviewPropsForToolbar<ObjectField<Schema>>
          onShowEditMode(): void
          onRemove(): void
        }) => ReactElement
      }
  )
): ComponentBlock<Schema> {
  return options as any
}

export function NotEditable({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <span style={{ userSelect: 'none' }} contentEditable={false} {...props}>
      {children}
    </span>
  )
}
