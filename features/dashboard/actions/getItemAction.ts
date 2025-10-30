/**
 * dashboard Item Action - Exact copy of Keystone's useListItem query
 * Fetches item data with proper adminMeta including isRequired fields
 */

'use server'

import { keystoneClient } from '../lib/keystoneClient'
import { getFieldTypeFromViewsIndex } from '../views/getFieldTypeFromViewsIndex'

interface CacheOptions {
  next?: {
    tags?: string[]
    revalidate?: number
  }
}

// Server-side GraphQL selections for different field types
// This duplicates the client-side selections but is necessary for server actions
const FIELD_GRAPHQL_SELECTIONS: Record<string, (fieldPath: string, fieldMeta?: any) => string> = {
  bigInt: (fieldPath) => fieldPath,
  checkbox: (fieldPath) => fieldPath,
  document: (fieldPath) => `${fieldPath} { document }`,
  float: (fieldPath) => fieldPath,
  integer: (fieldPath) => fieldPath,
  json: (fieldPath) => fieldPath,
  password: (fieldPath) => `${fieldPath} { isSet }`,
  relationship: (fieldPath, fieldMeta) => `${fieldPath} { id label: ${fieldMeta?.refLabelField || 'name'} }`,
  select: (fieldPath) => fieldPath,
  text: (fieldPath) => fieldPath,
  timestamp: (fieldPath) => fieldPath,
  id: (fieldPath) => fieldPath,
  decimal: (fieldPath) => fieldPath,
  virtual: (fieldPath, fieldMeta) => `${fieldPath}${fieldMeta?.query}`,
  image: (fieldPath) => `${fieldPath} {
    id
    url
    extension
    filesize
    width
    height
  }`,
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

export async function getItemAction(
  list: any,
  itemId: string,
  options: any = {},
  cacheOptions?: CacheOptions
): Promise<{ success: true; data: any } | { success: false; error: string; errors?: any }> {
  try {
    // Build GraphQL selection for item fields - only non-hidden fields
    const selectedFields = Object.values(list.fields)
      .filter((field: any) => {
        if (field.path === 'id') return true
        return field.itemView?.fieldMode !== 'hidden'
      })
      .map((field: any) => {
        return getFieldGraphQLSelection(field)
      })
      .join('\n')

    // Exact copy of Keystone's useListItem query with adminMeta
    const query = `
      query KsFetchItem ($id: ID!, $listKey: String!) {
        item: ${list.graphql.names.itemQueryName}(where: {id: $id}) {
          ${selectedFields}
        }
        keystone {
          adminMeta {
            list(key: $listKey) {
              fields {
                path
                itemView(id: $id) {
                  fieldMode
                  fieldPosition
                }
              }
            }
          }
        }
      }
    `

    const response = await keystoneClient(query, {
      id: itemId,
      listKey: list.key
    }, cacheOptions)

    if (!response.success) {
      console.error('GraphQL errors:', response.error)
      return {
        success: false,
        error: response.error,
        errors: response.errors
      }
    }

    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('Error in getItemAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}