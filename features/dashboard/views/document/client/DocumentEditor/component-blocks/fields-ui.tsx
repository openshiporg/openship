import { useState } from 'react'
import { useFilter } from '@react-aria/i18n'

import { type FormField } from './api-shared'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label' // Added for consistency
import { X } from 'lucide-react' // For removing tags

export function makeIntegerFieldInput(opts: {
  label: string
  validate: (value: number) => boolean
}): FormField<number, unknown>['Input'] {
  return function IntegerFieldInput({ autoFocus, forceValidation, onChange, value }) {
    const [isDirty, setDirty] = useState(false)
    return (
      <div className="space-y-1">
        <Label htmlFor={opts.label}>{opts.label}</Label>
        <Input
          id={opts.label}
          type="number"
          autoFocus={autoFocus}
          step={1}
          onBlur={() => setDirty(true)}
          onChange={e => {
            const val = parseInt(e.target.value, 10)
            onChange?.(!Number.isInteger(val) ? NaN : val)
          }}
          value={value ?? NaN}
          className={((forceValidation || isDirty) && !opts.validate(value)) ? "border-red-500" : ""}
        />
        {((forceValidation || isDirty) && !opts.validate(value)) && (
          <p className="text-sm text-red-500">Invalid integer</p>
        )}
      </div>
    )
  }
}

export function makeUrlFieldInput(opts: {
  label: string
  validate: (value: string) => boolean
}): FormField<string, unknown>['Input'] {
  return function UrlFieldInput({ autoFocus, forceValidation, onChange, value }) {
    const [isDirty, setDirty] = useState(false)
    return (
      <div className="space-y-1">
        <Label htmlFor={opts.label}>{opts.label}</Label>
        <Input
          id={opts.label}
          type="url"
          autoFocus={autoFocus}
          onBlur={() => setDirty(true)}
          onChange={e => onChange?.(e.target.value)}
          value={value}
          className={((forceValidation || isDirty) && !opts.validate(value)) ? "border-red-500" : ""}
        />
        {((forceValidation || isDirty) && !opts.validate(value)) && (
          <p className="text-sm text-red-500">Invalid URL</p>
        )}
      </div>
    )
  }
}

export function makeSelectFieldInput({
  label,
  options,
}: {
  label: string
  options: readonly { label: string; value: string }[]
}): FormField<string, unknown>['Input'] {
  return function SelectFieldInput({ autoFocus, onChange, value }) {
    return (
      <div className="space-y-1">
        <Label>{label}</Label>
        <Select
          onValueChange={(val) => onChange?.(val)}
          value={value}
          // autoFocus prop might not be directly available, handle focus manually if needed
        >
          <SelectTrigger autoFocus={autoFocus}>
            <SelectValue placeholder={`Select ${label}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map(item => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }
}

export function makeMultiselectFieldInput({
  label,
  options,
}: {
  label: string
  options: readonly { label: string; value: string }[]
}): FormField<string[], unknown>['Input'] {
  return function ComboFieldInput({ autoFocus, forceValidation, onChange, value }) {
    const [filterText, setFilterText] = useState('')
    const { contains } = useFilter({ sensitivity: 'base' })
    const items = options.filter(option => !value.some(x => x === option.value))
    const filteredItems = filterText
      ? items.filter(item => contains(item.label, filterText))
      : items

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Command className="rounded-lg border shadow-md">
          <CommandInput
            placeholder={`Search ${label}...`}
            value={filterText}
            onValueChange={setFilterText}
            autoFocus={autoFocus}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              {filteredItems.map(item => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={currentValue => {
                    if (onChange) {
                      onChange([...value, currentValue])
                    }
                    setFilterText('')
                  }}
                >
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="flex flex-wrap gap-1">
          {value.map(itemValue => {
            const option = options.find(opt => opt.value === itemValue)
            return (
              <Badge key={itemValue} variant="secondary">
                {option ? option.label : itemValue}
                {onChange && (
                  <button
                    type="button"
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={() => onChange(value.filter(v => v !== itemValue))}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </Badge>
            )
          })}
          {value.length === 0 && (
            <p className="text-sm text-neutral-500">No items…</p>
          )}
        </div>
      </div>
    )
  }
}
// Re-export ShadCN components if they are intended to be used directly from this module
export { Input, Textarea, Checkbox }
