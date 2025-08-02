/**
 * Server action to fetch list items using GraphQL
 */

'use server'

import { keystoneClient } from '../lib/keystoneClient'
import { getListByPath } from './getListByPath'
import { getFieldTypeFromViewsIndex } from '../views/getFieldTypeFromViewsIndex'

interface ListItemsVariables extends Record<string, unknown> {
  where?: any
  take: number
  skip: number
  orderBy?: any[]
}

interface ListItemsResponse {
  items: any[]
  count: number
}

interface CacheOptions {
  next?: {
    tags?: string[]
    revalidate?: number
  }
}

// Server-side GraphQL selections for different field types - copied from getItemAction.ts
const FIELD_GRAPHQL_SELECTIONS: Record<string, (fieldPath: string, fieldMeta?: any) => string> = {
  bigInt: (fieldPath) => fieldPath,
  checkbox: (fieldPath) => fieldPath,
  document: (fieldPath) => `${fieldPath} { document(hydrateRelationships: true) }`,
  float: (fieldPath) => fieldPath,
  integer: (fieldPath) => fieldPath,
  json: (fieldPath) => fieldPath,
  password: (fieldPath) => `${fieldPath} { isSet }`,
  relationship: (fieldPath, fieldMeta) => {
    // Handle count display mode like the field controller
    if (fieldMeta?.displayMode === 'count') {
      return `${fieldPath}Count`
    }
    return `${fieldPath} { id label: ${fieldMeta?.refLabelField || 'name'} }`
  },
  select: (fieldPath) => fieldPath,
  text: (fieldPath) => fieldPath,
  timestamp: (fieldPath) => fieldPath,
  id: (fieldPath) => fieldPath,
  decimal: (fieldPath) => fieldPath,
  virtual: (fieldPath, fieldMeta) => `${fieldPath}${fieldMeta?.query || ''}`,
  image: (fieldPath) => `${fieldPath} { id url width height extension filesize }`,
  // Add more field types as needed
}

function getFieldGraphQLSelection(field: any): string {
  // If field already has a controller with graphqlSelection, use it
  if (field.controller?.graphqlSelection) {
    return field.controller.graphqlSelection
  }
  
  // Otherwise use viewsIndex to determine field type
  if (typeof field.viewsIndex === 'number') {
    try {
      const fieldType = getFieldTypeFromViewsIndex(field.viewsIndex)
      const selectionFn = FIELD_GRAPHQL_SELECTIONS[fieldType]
      
      if (selectionFn) {
        return selectionFn(field.path, field.fieldMeta)
      }
    } catch (error) {
      console.warn(`Could not get field type for viewsIndex ${field.viewsIndex}:`, error)
    }
  }
  
  // Fallback to just the field path
  return field.path
}

export async function getListItemsAction(
  listKey: string, 
  variables: ListItemsVariables,
  selectedFields: string[] = ['id'],
  cacheOptions?: CacheOptions
): Promise<{ success: true; data: ListItemsResponse } | { success: false; error: string }> {
  try {
    // Get list metadata
    const list = await getListByPath(listKey)
    if (!list) {
      console.error(`❌ List not found: ${listKey}`)
      return { success: false, error: `List not found: ${listKey}` }
    }
    
    // Build GraphQL selection for list fields - using the same pattern as getItemAction
    const selectedGqlFields = selectedFields
      .map(fieldPath => {
        if (fieldPath === 'id') return 'id' // Always include id as-is
        
        const field = list.fields[fieldPath]
        if (!field) {
          console.warn(`⚠️ Field not found: ${fieldPath}`)
          return fieldPath // fallback
        }
        
        return getFieldGraphQLSelection(field)
      })
      .join('\n')
    
    // Build the GraphQL query following Keystone's exact pattern
    const query = `
      query GetListItems(
        $where: ${list.graphql.names.whereInputName},
        $take: Int!,
        $skip: Int!,
        $orderBy: [${list.graphql.names.listOrderName}!]
      ) {
        items: ${list.graphql.names.listQueryName}(
          where: $where,
          take: $take,
          skip: $skip,
          orderBy: $orderBy
        ) {
          id
          ${selectedGqlFields}
        }
        count: ${list.graphql.names.listQueryCountName}(where: $where)
      }
    `
    
    // Execute the query
    const response = await keystoneClient(query, variables, cacheOptions)
    
    if (!response.success) {
      console.error(`❌ GraphQL query failed:`, response.error)
      return { success: false, error: response.error }
    }
    
    return {
      success: true,
      data: {
        items: response.data.items || [],
        count: response.data.count || 0
      }
    }
    
  } catch (error) {
    console.error(`💥 Error fetching list items for ${listKey}:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}