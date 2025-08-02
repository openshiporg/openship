'use client'

import { useState, ReactNode } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ListMeta } from '../types'

interface FieldSelectionProps {
  listMeta: ListMeta
  selectedFields: Set<string>
  children?: ReactNode
}

function isArrayEqual(arrA: string[], arrB: string[]) {
  if (arrA.length !== arrB.length) return false
  for (let i = 0; i < arrA.length; i++) {
    if (arrA[i] !== arrB[i]) {
      return false
    }
  }
  return true
}

function FieldSelectionContent({
  listMeta,
  selectedFields: currentSelectedFields,
}: {
  listMeta: ListMeta
  selectedFields: Set<string>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Create a query object that behaves like the old query object
  const query: Record<string, string> = {}
  if (searchParams) {
    for (const [key, value] of searchParams.entries()) {
      query[key] = value
    }
  }

  const setNewSelectedFields = (fields: string[]) => {
    if (isArrayEqual(fields, listMeta.initialColumns || [])) {
      const otherQueryFields = { ...query } // Copy query params
      delete otherQueryFields.fields // Remove the 'fields' parameter if it exists
      router.push(`${pathname}?${new URLSearchParams(otherQueryFields)}`)
    } else {
      router.push(
        `${pathname}?${new URLSearchParams({
          ...query,
          fields: fields.join(','),
        })}`
      )
    }
  }

  // Filter out 'id' field from UI display but keep it in logic
  const selectedFieldsForUI = new Set([...currentSelectedFields].filter(f => f !== 'id'))

  const fields = Object.entries(listMeta.fields)
    .filter(([path]) => path !== 'id') // Don't show id field in UI
    .map(([path, field]) => ({
      value: path,
      label: field.label,
      isDisabled: selectedFieldsForUI.size === 1 && selectedFieldsForUI.has(path),
    }))

  return (
    <>
      <DropdownMenuLabel>Display columns</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <div className="max-h-72 overflow-y-auto">
        {fields.map((field) => (
          <DropdownMenuCheckboxItem
            key={field.value}
            checked={selectedFieldsForUI.has(field.value)}
            onCheckedChange={(checked) => {
              const newSelectedFields = new Set(selectedFieldsForUI)
              if (checked) {
                newSelectedFields.add(field.value)
              } else {
                newSelectedFields.delete(field.value)
              }
              // Always include 'id' field but don't show it in UI
              const fieldsWithId = ['id', ...Array.from(newSelectedFields)]
              setNewSelectedFields(fieldsWithId)
            }}
            onSelect={(e) => e.preventDefault()}
            disabled={field.isDisabled}
          >
            {field.label}
          </DropdownMenuCheckboxItem>
        ))}
      </div>
    </>
  )
}

export function FieldSelection({ listMeta, selectedFields, children }: FieldSelectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  const DefaultTrigger = () => (
    <Button
      variant="outline"
      size="sm"
      className="flex gap-1.5 px-3 text-xs font-medium"
    >
      <Columns3 className="h-3 w-3" />
      COLUMNS
    </Button>
  )

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {children || <DefaultTrigger />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {isOpen && (
          <FieldSelectionContent
            listMeta={listMeta}
            selectedFields={selectedFields}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}