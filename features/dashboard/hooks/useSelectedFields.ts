import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ListMeta } from '../types'

export function useSelectedFields(list: ListMeta) {
  const searchParams = useSearchParams()
  
  return useMemo(() => {
    const fieldsFromUrl = searchParams?.get('fields')
    
    let selectedFieldsArray: string[]
    
    if (fieldsFromUrl) {
      selectedFieldsArray = fieldsFromUrl.split(',').filter(field => {
        return field in list.fields
      })
    } else {
      selectedFieldsArray = list.initialColumns || []
    }
    
    // Ensure we always have at least one field
    if (selectedFieldsArray.length === 0) {
      selectedFieldsArray = Object.keys(list.fields).slice(0, 1)
    }
    
    // Always include id field if not present but don't show it in UI
    const fieldsWithId = selectedFieldsArray.includes('id') 
      ? selectedFieldsArray 
      : ['id', ...selectedFieldsArray]
    
    return new Set(fieldsWithId)
  }, [searchParams, list.fields, list.initialColumns])
}