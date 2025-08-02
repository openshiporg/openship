'use client'

import { useState, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { X as XIcon, Filter as FilterIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { enhanceFields } from '../utils/enhanceFields'

interface FilterListProps {
  list: any
}

interface Filter {
  field: string
  type: string
  value: unknown
}

interface FilterPillProps {
  filter: Filter
  field: any
}

interface EditDialogProps extends FilterPillProps {
  onClose: () => void
}

interface FilterWrapperProps {
  field: any
  operator: string
  value: unknown
  onChange: (value: unknown) => void
}

export function FilterList({ list }: FilterListProps) {
  const searchParams = useSearchParams()
  
  // Get enhanced fields using dashboard's pattern
  const enhancedFields = useMemo(() => {
    return enhanceFields(list.fields, list.key)
  }, [list.fields, list.key])
  
  // Pre-compute all possible filter combinations (exactly like KeystoneJS)
  const possibleFilters = useMemo(() => {
    const possibleFilters: Record<string, { type: string; field: string }> = {}

    for (const [fieldPath, field] of Object.entries(enhancedFields)) {
      if (field.controller?.filter) {
        for (const filterType in field.controller.filter.types) {
          possibleFilters[`!${fieldPath}_${filterType}`] = {
            type: filterType,
            field: fieldPath,
          }
        }
      }
    }
    return possibleFilters
  }, [enhancedFields])

  // Get active filters by checking URL params (exactly like KeystoneJS)
  const activeFilters = useMemo(() => {
    if (!searchParams) return []

    const filters: Array<{
      id: string
      fieldPath: string
      filterType: string
      value: unknown
      field: any
      controller: any
      Filter: any
      Label: (props: { type: string; value: unknown }) => string
    }> = []

    searchParams.forEach((value, key) => {
      const filter = possibleFilters[key]
      if (!filter) return
      
      const field = enhancedFields[filter.field]
      if (!field || !field.controller?.filter) return
      
      // Parse the JSON value
      let parsedValue
      try {
        parsedValue = JSON.parse(value)
      } catch {
        parsedValue = value
      }
      
      filters.push({
        id: key,
        fieldPath: filter.field,
        filterType: filter.type,
        value: parsedValue,
        field,
        controller: field.controller,
        Filter: field.controller.filter.Filter,
        Label: ({ type, value }: { type: string; value: unknown }) => {
          if (field.controller.filter.Label) {
            return field.controller.filter.Label({
              label: field.label,
              type,
              value
            })
          }
          return `${field.label} ${type} ${value}`
        }
      })
    })

    return filters
  }, [searchParams, possibleFilters, enhancedFields])

  if (activeFilters.length === 0) return null

  return (
    <div className="flex gap-1.5 border-t bg-muted/40 py-2 -mx-4 md:-mx-6 px-4 md:px-6 items-center">
      <div className="flex items-center gap-1.5 border-r border-muted-foreground/30 pr-2 mr-1.5">
        <FilterIcon
          className="stroke-muted-foreground/50 size-4"
          strokeWidth={1.5}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {activeFilters.map((filter) => (
          <FilterPill
            key={filter.id}
            filter={{
              field: filter.fieldPath,
              type: filter.filterType,
              value: filter.value
            }}
            field={filter.field}
          />
        ))}
      </div>
    </div>
  )
}

function FilterPill({ filter, field }: FilterPillProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [popoverOpen, setPopoverOpen] = useState(false)

  // Get filter label using KeystoneJS pattern
  const filterLabel = useMemo(() => {
    if (field.controller?.filter?.Label) {
      const filterTypeLabel = field.controller.filter.types[filter.type]?.label || filter.type
      return field.controller.filter.Label({
        label: filterTypeLabel,
        type: filter.type,
        value: filter.value
      })
    }
    return `${field.label} ${filter.type} ${filter.value}`
  }, [field, filter])

  const onRemove = () => {
    const newSearchParams = new URLSearchParams(searchParams?.toString() ?? '')
    newSearchParams.delete(`!${filter.field}_${filter.type}`)
    newSearchParams.delete('page')
    router.push(`${pathname}?${newSearchParams.toString()}`)
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <div className="inline-flex">
          <Button
            className="h-7 rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <XIcon size={16} aria-hidden="true" />
          </Button>
          <Button
            className="h-7 rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10 justify-start uppercase text-xs max-w-64"
            variant="outline"
            size="sm"
          >
            <span className="opacity-75 mr-1">{field.label}</span>
            <ChevronRightIcon className="shrink-0 mx-0.5" size={14} />
            <span className="font-semibold truncate">
              {filterLabel}
            </span>
            <ChevronDownIcon className="shrink-0 ml-1" size={14} />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <EditDialog
          filter={filter}
          field={field}
          onClose={() => setPopoverOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}

function FilterWrapper({ field, operator, value, onChange }: FilterWrapperProps) {
  // Get Filter component from field controller
  const Filter = field.controller?.filter?.Filter
  if (!Filter) return null
  
  return (
    <Filter
      autoFocus
      context="edit"
      type={operator}
      value={value as string | number | boolean}
      onChange={onChange}
    />
  )
}

function EditDialog({ filter, field, onClose }: EditDialogProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [value, setValue] = useState(filter.value)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const newSearchParams = new URLSearchParams(searchParams?.toString() ?? '')
    
    // Remove any existing filters for this field first
    const keysToRemove: string[] = []
    newSearchParams.forEach((_, key) => {
      if (key.startsWith(`!${filter.field}_`)) {
        keysToRemove.push(key)
      }
    })
    keysToRemove.forEach(key => newSearchParams.delete(key))
    
    // Reset page and add the updated filter
    newSearchParams.delete('page')
    newSearchParams.set(`!${filter.field}_${filter.type}`, JSON.stringify(value))
    
    router.push(`${pathname}?${newSearchParams.toString()}`)
    onClose()
  }

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <div className="px-2 pt-3 pb-1">
        <FilterWrapper
          field={field}
          operator={filter.type}
          value={value}
          onChange={setValue}
        />
      </div>
      <Separator />
      <div className="flex justify-between gap-2 px-2 pb-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" type="submit">
          Save
        </Button>
      </div>
    </form>
  )
}