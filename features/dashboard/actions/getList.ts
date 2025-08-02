/**
 * Get list metadata by listKey - uses enhanced AdminMeta from SWR
 */

'use server'

import { getAdminMetaAction } from './getAdminMetaAction'

export async function getList(listKey: string) {
  try {
    // Get the full enhanced admin meta (which already has gqlNames for all lists)
    const response = await getAdminMetaAction()
    
    if (!response.success) {
      return null
    }

    const adminMeta = response.data
    if (!adminMeta?.lists) {
      return null
    }

    // Find the list by key
    const rawList = adminMeta.lists.find((l: any) => l.key === listKey)
    
    if (!rawList) {
      return null
    }

    // Transform fields into a record for easier access
    const fields: Record<string, any> = {}
    rawList.fields.forEach((field: any) => {
      fields[field.path] = field
    })

    // List is already enhanced with gqlNames from getAdminMetaAction
    return {
      ...rawList,
      fields // Return fields as a record
    }
  } catch (error) {
    console.error('Error in getList:', error)
    return null
  }
}