'use client'

import { RelationshipSelect } from './client/components/RelationshipSelect'
import { getList } from '@/features/dashboard/actions/getList'
import useSWR from 'swr'

interface ClientRelationshipFilterProps {
  value: string | string[] | null
  onChange: (value: string | string[] | null) => void
  type: string
  autoFocus?: boolean
  refListKey: string
  refLabelField: string
  refSearchFields: string[]
}

export function ClientRelationshipFilter({
  value,
  onChange,
  type,
  autoFocus,
  refListKey,
  refLabelField,
  refSearchFields,
}: ClientRelationshipFilterProps) {
  // Get list data EXACTLY like the field does
  const { data: refList } = useSWR(
    `list-${refListKey}`,
    async () => {
      return await getList(refListKey)
    }
  )
  
  if (!refList) return null
  
  // Empty/not_empty should not show any UI - handled in parent
  if (type === 'empty' || type === 'not_empty') return null
  
  // Single relationship filter types: 'is' or 'not_is'
  if (type === 'is' || type === 'not_is') {
    // Keystone creates value like this for single filters
    const currentValue = typeof value === 'string' 
      ? { id: value, label: value, built: false }
      : null
      
    const state = {
      kind: 'one' as const,
      value: currentValue,
      onChange(newItem: any) {
        onChange(newItem === null ? null : newItem.id.toString())
      },
    }
    
    return (
      <RelationshipSelect
        autoFocus={autoFocus}
        list={refList}
        labelField={refLabelField}
        searchFields={refSearchFields}
        state={state}
        controlShouldRenderValue
      />
    )
  }
  
  // Many relationship filter types: 'some' or 'not_some'
  // This is EXACTLY how Keystone does it in the repomix
  const ids = Array.isArray(value) ? value : []
  const values = ids.map((id) => ({ id, label: id, built: false }))
  
  const state = {
    kind: 'many' as const,
    value: values,
    onChange(newItems: any[]) {
      onChange(newItems.map(x => x.id.toString()))
    },
  }
  
  // Keystone uses VStack with ComboboxMany and TagGroup
  // We use RelationshipSelect which already has the multi-select behavior
  return (
    <RelationshipSelect
      autoFocus={autoFocus}
      list={refList}
      labelField={refLabelField}
      searchFields={refSearchFields}
      state={state}
      controlShouldRenderValue
    />
  )
}