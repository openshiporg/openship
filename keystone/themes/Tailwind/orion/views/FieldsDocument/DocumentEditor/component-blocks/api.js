
import { graphql } from '@keystone-6/core'

import {
  useState
} from 'react'
import { isValidURL } from '../isValidURL'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { Input } from '@ui/input'
import { Checkbox as UiCheckbox } from '@ui/checkbox'

export const fields = {
  text ({ label, defaultValue = '' }) {
    return {
      kind: 'form',
      Input ({ value, onChange, autoFocus }) {
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
      validate (value) {
        return typeof value === 'string'
      },
      graphql: {
        input: graphql.String,
        output: graphql.field({ type: graphql.String }),
      },
    }
  },
  integer ({ label, defaultValue = 0 }) {
    const validate = (value) => {
      return typeof value === 'number' && Number.isFinite(value)
    }
    return {
      kind: 'form',
      Input ({ value, onChange, autoFocus, forceValidation }) {
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
  url ({ label, defaultValue = '' }) {
    const validate = (value) => {
      return typeof value === 'string' && (value === '' || isValidURL(value))
    }
    return {
      kind: 'form',
      Input ({ value, onChange, autoFocus, forceValidation }) {
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
  select ({ label, options, defaultValue }) {
    const optionValuesSet = new Set(options.map(x => x.value))
    if (!optionValuesSet.has(defaultValue)) {
      throw new Error(
        `A defaultValue of ${defaultValue} was provided to a select field but it does not match the value of one of the options provided`
      )
    }
    return {
      kind: 'form',
      Input ({ value, onChange, autoFocus }) {
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
      validate (value) {
        return typeof value === 'string' && optionValuesSet.has(value)
      },
      graphql: {
        input: graphql.String,
        output: graphql.field({
          type: graphql.String,
          resolve ({ value }) {
            return value
          },
        }),
      },
    }
  },
  multiselect ({ label, options, defaultValue }) {
    const valuesToOption = new Map(options.map(x => [x.value, x]))
    return {
      kind: 'form',
      Input ({ value, onChange, autoFocus }) {
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <Select
              multiple
              value={value}
              onValueChange={onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select options" />
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
      validate (value) {
        return (
          Array.isArray(value) &&
          value.every(value => typeof value === 'string' && valuesToOption.has(value))
        )
      },
      graphql: {
        input: graphql.list(graphql.nonNull(graphql.String)),
        output: graphql.field({
          type: graphql.list(graphql.nonNull(graphql.String)),
          resolve ({ value }) {
            return value
          },
        }),
      },
    }
  },
  checkbox ({ label, defaultValue = false }) {
    return {
      kind: 'form',
      Input ({ value, onChange, autoFocus }) {
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
      validate (value) {
        return typeof value === 'boolean'
      },
      graphql: {
        input: graphql.Boolean,
        output: graphql.field({ type: graphql.Boolean }),
      },
    }
  },
  empty () {
    return {
      kind: 'form',
      Input () {
        return null
      },
      options: undefined,
      defaultValue: null,
      validate (value) {
        return value === null || value === undefined
      },
    }
  },
  child (options) {
    return {
      kind: 'child',
      options:
        options.kind === 'block'
          ? {
              kind: 'block',
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
            }
          : {
              kind: 'inline',
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
  object (fields) {
    return { kind: 'object', fields }
  },
  conditional (discriminant, values) {
    if (
      (discriminant.validate('true') || discriminant.validate('false')) &&
      (discriminant.validate(true) || discriminant.validate(false))
    ) {
      throw new Error(
        'The discriminant of a conditional field only supports string values, or boolean values, not both.'
      )
    }
    return {
      kind: 'conditional',
      discriminant,
      values: values,
    }
  },
  relationship ({ listKey, selection, label, many }) {
    return {
      kind: 'relationship',
      listKey,
      selection,
      label,
      many: many ? true : false,
    }
  },
  array (element, opts) {
    return { kind: 'array', element, itemLabel: opts?.itemLabel, label: opts?.label }
  },
}

export function component (options) {
  return options
}

export const NotEditable = ({ children, ...props }) => (
  <span className="select-none" contentEditable={false} {...props}>
    {children}
  </span>
) 