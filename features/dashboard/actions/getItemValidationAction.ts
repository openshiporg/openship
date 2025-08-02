/**
 * Get item-specific validation data - following Keystone's pattern
 */

'use server'

import { keystoneClient } from '../lib/keystoneClient'

export async function getItemValidationAction(listKey: string, itemId: string) {
  try {
    // Query for item-specific validation data matching Keystone's useListItem pattern
    const query = `
      query KsGetItemValidation($id: ID!, $listKey: String!) {
        keystone {
          adminMeta {
            list(key: $listKey) {
              fields {
                path
                isNonNull
                fieldMeta
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

    const response = await keystoneClient(query, { id: itemId, listKey })

    if (!response.success) {
      console.error('Failed to fetch item validation:', response.error)
      return response
    }

    const fields = response.data?.keystone?.adminMeta?.list?.fields || []

    // Transform into a map for easier access
    const validationMap: Record<string, { 
      fieldMode: string; 
      fieldPosition: string; 
      isRequired: boolean;
      isNonNull: string[];
      fieldMeta: any;
    }> = {}
    
    fields.forEach((field: any) => {
      if (field.itemView) {
        validationMap[field.path] = {
          fieldMode: field.itemView.fieldMode || 'edit',
          fieldPosition: field.itemView.fieldPosition || 'form',
          isRequired: field.fieldMeta?.validation?.isRequired || false,
          isNonNull: field.isNonNull || [],
          fieldMeta: field.fieldMeta || {}
        }
      }
    })

    return {
      success: true,
      data: validationMap
    }
  } catch (error) {
    console.error('Error in getItemValidationAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}