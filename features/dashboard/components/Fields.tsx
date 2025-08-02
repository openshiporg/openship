/**
 * Fields component - Following Keystone's exact pattern with field grouping support
 * Creates controllers and renders fields dynamically using viewsIndex
 */

'use client'

import React, { useMemo, useId, ReactNode } from 'react'
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// Exact copy from Keystone - testFilter function
function applyFilter<T>(
  filter: {
    equals?: T
    in?: T[]
  },
  val: T
): boolean {
  if (filter.equals !== undefined && val !== filter.equals) return false
  if (filter.in !== undefined && !filter.in.includes(val)) return false
  return true
}

export function testFilter(
  filter: any | undefined,
  serialized: Record<string, unknown>
): boolean {
  if (filter === undefined) return false
  if (typeof filter === 'boolean') return filter
  for (const [key, filterOnField] of Object.entries(filter)) {
    const serializedValue = serialized[key]
    if (!applyFilter(filterOnField as any, serializedValue)) return false
    if ((filterOnField as any).not !== undefined && applyFilter((filterOnField as any).not, serializedValue)) {
      return false
    }
  }
  return true
}

interface FieldGroupMeta {
  label: string
  description?: string | null
  fields: { path: string }[]
}

interface FieldsProps {
  list: any
  fields: Record<string, any>
  value: Record<string, unknown>
  onChange?: (values: Record<string, unknown>) => void
  forceValidation?: boolean
  invalidFields?: ReadonlySet<string>
  isRequireds?: Record<string, any>
  view?: 'createView' | 'itemView'
  groups?: FieldGroupMeta[]
}

export function Fields({ fields, value, onChange, forceValidation, invalidFields, isRequireds, view = 'itemView', groups = [] }: FieldsProps) {
  // Create serialized data exactly like Keystone for testFilter
  const serialized = useMemo(() => {
    const result: Record<string, unknown> = {}
    for (const [fieldKey, field] of Object.entries(fields)) {
      Object.assign(result, field.controller.serialize(value[fieldKey]))
    }
    return result
  }, [fields, value])

  // Render a single field
  const renderField = (fieldPath: string, field: any) => {
    const fieldValue = value[fieldPath]
    
    // Get field mode from the appropriate view - following Keystone pattern
    const fieldModeFilter = field[view]?.fieldMode || 'edit'
    let fieldMode: 'read' | 'edit' | 'hidden'
    
    if (typeof fieldModeFilter === 'string') {
      fieldMode = fieldModeFilter as 'read' | 'edit' | 'hidden'
    } else {
      // Handle conditional field modes
      if (testFilter(fieldModeFilter?.edit, serialized)) fieldMode = 'edit'
      else if (view === 'itemView' && testFilter(fieldModeFilter?.read, serialized)) fieldMode = 'read'
      else fieldMode = 'hidden'
    }
    
    const isReadOnly = fieldMode === 'read' || fieldMode === 'hidden'
    
    if (fieldMode === 'hidden') {
      return null
    }

    return (
      <field.views.Field
        key={fieldPath}
        field={field.controller}
        value={fieldValue}
        forceValidation={forceValidation && invalidFields?.has(fieldPath)}
        isRequired={testFilter(isRequireds?.[fieldPath] ?? false, serialized)}
        onChange={
          isReadOnly || !onChange
            ? undefined
            : (newFieldValue: unknown) => {
                onChange({
                  ...value,
                  [fieldPath]: newFieldValue,
                })
              }
        }
      />
    )
  }

  // Group fields logic
  const renderedFields = Object.fromEntries(
    Object.keys(fields).map((fieldKey) => [fieldKey, renderField(fieldKey, fields[fieldKey])])
  )

  const rendered: ReactNode[] = []
  const fieldGroups = new Map()
  
  // Create group mapping
  for (const group of groups) {
    const state = { group, rendered: false }
    for (const field of group.fields) {
      fieldGroups.set(field.path, state)
    }
  }

  // Render grouped and ungrouped fields
  for (const field of Object.values(fields)) {
    const fieldKey = field.path
    if (fieldGroups.has(fieldKey)) {
      const groupState = fieldGroups.get(field.path)
      if (groupState.rendered) {
        continue
      }
      groupState.rendered = true
      const { group } = groupState
      const renderedFieldsInGroup = group.fields.map(
        (field: { path: string }) => renderedFields[field.path]
      )
      if (renderedFieldsInGroup.every((field: ReactNode | null) => field === null)) {
        continue
      }

      rendered.push(
        <FieldGroup
          key={group.label}
          count={group.fields.length}
          label={group.label}
          description={group.description}
        >
          {renderedFieldsInGroup}
        </FieldGroup>
      )
      continue
    }
    if (renderedFields[fieldKey] === null) {
      continue
    }
    rendered.push(renderedFields[fieldKey])
  }

  return (
    <div className="grid w-full items-center gap-4">
      {rendered.length === 0 && value && Object.keys(value).length === 0
        ? "There are no fields that you can read or edit"
        : rendered}
    </div>
  )
}

function FieldGroup(props: {
  label: string
  description?: string | null
  count: number
  children: ReactNode
}) {
  const descriptionId = useId()
  const labelId = useId()

  const divider = <Separator orientation="vertical" />

  // Count actual fields (excluding virtual fields in create view)
  const actualFieldCount = props.children ? Array.isArray(props.children) ? props.children.filter(
    (item) =>
      item !== undefined &&
      !(
        item?.props?.value &&
        typeof item?.props?.value === "symbol" &&
        item?.props?.value.toString() ===
          "Symbol(create view virtual field value)"
      )
  ).length : 1 : 0

  // Don't render the group if there are no actual fields
  if (actualFieldCount === 0) {
    return null
  }

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={props.description === null || props.description === undefined ? undefined : descriptionId}
    >
      <details open className="group">
        <summary className="list-none outline-none [&::-webkit-details-marker]:hidden cursor-pointer">
          <div className="flex gap-1.5">
            <span>
              <div
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  "border self-start transition-transform group-open:rotate-90 [&_svg]:size-3 h-6 w-6"
                )}
              >
                <ChevronRight />
              </div>
            </span>
            {divider}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div id={labelId} className="relative text-lg/5 font-medium">
                  {props.label}
                </div>
                <Badge className="text-[.7rem] py-0.5 uppercase tracking-wide font-medium">
                  {actualFieldCount} FIELD{actualFieldCount !== 1 && "S"}
                </Badge>
              </div>
              {props.description !== null && props.description !== undefined && (
                <p
                  className="opacity-50 text-sm"
                  id={descriptionId}
                >
                  {props.description}
                </p>
              )}
            </div>
          </div>
        </summary>
        <div className="flex ml-[2.25rem] mt-2">
          {divider}
          <div className="w-full">
            <div className="space-y-4">{props.children}</div>
          </div>
        </div>
      </details>
    </div>
  )
}